/**
 * 核心嗅探逻辑
 * L1 网络层 + L3 深度搜索
 */

import puppeteer, { type Browser, type Page, type HTTPResponse } from "puppeteer";
import { DEEP_SEARCH_SCRIPT } from "./deep-search.js";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import UserAgent from "user-agents";
import which from "which";

/** 嗅探结果 */
export interface SniffResult {
  url: string;
  ext: string;
  type: string;
  size: string;
  source: string;
  content?: string;
  headers?: Record<string, string>;
  requestHeaders?: Record<string, string>;
  filename?: string;
  keys?: number[][];
}

/** 密钥信息 */
export interface KeyInfo {
  key: number[];
  source: string;
}

/**
 * 判断是否为有效的 HTTP(S) URL
 */
function isValidHttpUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * 过滤掉误报（如 .d.ts 文件、相对路径等）
 */
function isFalsePositive(url: string, _ext: string): boolean {
  // 不是 HTTP URL
  if (!isValidHttpUrl(url)) return true;
  // .d.ts 文件是 TypeScript 声明文件，不是媒体
  if (url.endsWith(".d.ts")) return true;
  // 常见的非媒体误报
  if (url.includes("node_modules") || url.includes(".map")) return true;
  return false;
}

/**
 * 从 Content-Disposition 头中提取文件名
 */
function extractFilename(contentDisposition: string): string | null {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename[^;=\n]*=(\*?['"]?)([^"';\n]*)\1/i);
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * 从文件名中提取扩展名
 */
function getExtFromFilename(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return MEDIA_EXTS.has(ext) ? ext : null;
}

/**
 * 自动检测系统中的 Chromium 内核浏览器
 * 策略：优先通过 which 在 PATH 中查找，找不到再回退到常见安装路径
 * 优先级：Chrome > Edge > Brave > Opera
 */
function detectChromiumBrowser(): string | null {
  const os = platform();

  // 浏览器可执行文件名（按优先级排序）
  const browserNames = os === "win32"
    ? ["chrome", "msedge", "brave", "opera"]
    : ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "msedge", "microsoft-edge", "brave-browser", "brave-browser-stable", "opera"];

  // 第一优先：通过 which 在 PATH 中查找
  for (const name of browserNames) {
    const path = which.sync(name, { nothrow: true });
    if (path) {
      return path;
    }
  }

  // 第二优先：回退到常见安装路径（which 找不到时，比如 Windows 未添加到 PATH）
  const fallbackPaths = os === "win32"
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "C:\\Program Files\\Opera Software\\Opera Stable\\opera.exe",
      ]
    : os === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
          "/Applications/Opera.app/Contents/MacOS/Opera",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/usr/bin/microsoft-edge",
          "/usr/bin/microsoft-edge-stable",
          "/usr/bin/brave-browser",
          "/usr/bin/brave-browser-stable",
          "/usr/bin/opera",
        ];

  for (const path of fallbackPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/** 文件大小过滤器 */
export interface SizeFilter {
  /** 运算符：>=, <=, =, !=, <, >, ~(范围) */
  operator: ">=" | "<=" | "=" | "!=" | "<" | ">" | "~";
  /** 值（字节） */
  value: number;
  /** 范围上限（仅 operator 为 ~ 时使用） */
  maxValue?: number;
}

/** 嗅探配置 */
export interface SniffOptions {
  /** 目标 URL */
  url: string;
  /** 等待时间 (ms)，默认 8000 */
  waitTime?: number;
  /** 是否等待用户交互，默认 false */
  interactive?: boolean;
  /** 是否显示浏览器窗口，默认 false */
  headless?: boolean;
  /** 最小文件大小过滤 (bytes)，默认 0 */
  minSize?: number;
  /** 额外等待网络空闲时间 (ms)，默认 3000 */
  networkIdleTime?: number;
  /** 是否显示所有资源（含 .ts 分片），默认 false */
  showAll?: boolean;
  /** 自定义正则规则 */
  customRegex?: string[];
  /** 文件大小过滤器 */
  sizeFilter?: SizeFilter;
  /** 浏览器可执行文件路径，不传则自动检测 */
  executablePath?: string;
}

/** 媒体扩展名列表 */
const MEDIA_EXTS = new Set([
  "m3u8", "m3u", "mpd", "mp4", "mp3", "flv", "f4v",
  "webm", "ogg", "ogv", "mov", "mkv", "avi", "wmv",
  "asf", "m4a", "m4s", "aac", "wma", "wav", "mpeg",
  "ts", "key", "srt", "vtt", "weba", "opus",
]);

/** 媒体 MIME 类型列表 */
const MEDIA_TYPES = [
  "video/", "audio/",
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "application/dash+xml",
  "application/m4s",
  "application/octet-stream",
  "application/mp4",
];

/**
 * 获取 URL 扩展名
 */
function getExtension(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.split("?")[0];
    const ext = pathname.split(".").pop()?.toLowerCase() || "";
    return MEDIA_EXTS.has(ext) ? ext : null;
  } catch {
    return null;
  }
}

/**
 * 判断是否为媒体 MIME 类型
 */
function isMediaType(contentType: string): boolean {
  if (!contentType) return false;
  const ct = contentType.split(";")[0].toLowerCase().trim();
  return MEDIA_TYPES.some(t => ct.startsWith(t) || ct === t);
}

/**
 * 检查文件大小是否匹配过滤器
 */
function matchSizeFilter(size: number, filter: SizeFilter): boolean {
  switch (filter.operator) {
    case ">=": return size >= filter.value;
    case "<=": return size <= filter.value;
    case "=": return size === filter.value;
    case "!=": return size !== filter.value;
    case "<": return size < filter.value;
    case ">": return size > filter.value;
    case "~": return size >= filter.value && size <= (filter.maxValue || filter.value);
    default: return true;
  }
}

/**
 * 嗅探网页中的媒体资源
 */
export async function sniffMedia(options: SniffOptions): Promise<SniffResult[]> {
  const {
    url,
    waitTime = 8000,
    interactive = false,
    headless = true,
    minSize = 0,
    networkIdleTime = 3000,
    customRegex,
    sizeFilter,
  } = options;

  // 预编译自定义正则
  const compiledRegex = customRegex?.map(r => {
    try {
      return new RegExp(r);
    } catch {
      return null;
    }
  }).filter(Boolean) || [];

  const resultsMap = new Map<string, SniffResult>();
  const requestHeadersMap = new Map<string, Record<string, string>>();
  const keys: KeyInfo[] = [];

  // 自动检测浏览器
  const browserPath = options.executablePath || detectChromiumBrowser();
  if (!browserPath) {
    throw new Error("未找到 Chromium 内核浏览器，请安装 Chrome/Edge/Brave/Opera 之一，或通过 executablePath 参数指定路径");
  }
  console.error(`[嗅探] 使用浏览器：${browserPath}`);

  const browser: Browser = await puppeteer.launch({
    headless,
    executablePath: browserPath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  try {
    const page: Page = await browser.newPage();

    // 使用 user-agents 包生成随机 UA，过滤桌面端 Chrome
    const ua = UserAgent.random({ deviceCategory: "desktop", userAgent: /Chrome/ }) ?? new UserAgent();
    await page.setUserAgent(ua.toString());
    console.error(`[嗅探] User-Agent: ${ua.toString().substring(0, 80)}...`);

    // ===== L1: 网络层嗅探 =====
    // 监听请求，保存请求头
    page.on("request", (request) => {
      requestHeadersMap.set(request.url(), request.headers());
    });

    page.on("response", async (response: HTTPResponse) => {
      try {
        const responseUrl = response.url();
        const headers = response.headers();
        const contentType = headers["content-type"] || "";
        const contentLength = headers["content-length"] || "0";
        const size = parseInt(contentLength, 10) || 0;

        // 扩展名匹配
        const ext = getExtension(responseUrl);
        // MIME 类型匹配
        const isMedia = isMediaType(contentType);

        // Content-Disposition 检查
        const contentDisposition = headers["content-disposition"] || "";
        const filename = extractFilename(contentDisposition);
        const filenameExt = filename ? getExtFromFilename(filename) : null;

        // 自定义正则匹配
        let regexMatch = false;
        for (const regex of compiledRegex) {
          if (regex && regex.test(responseUrl)) {
            regexMatch = true;
            break;
          }
        }

        if (ext || isMedia || filenameExt || regexMatch) {
          // 过滤误报
          if (isFalsePositive(responseUrl, ext || filenameExt || "")) return;

          const finalExt = ext || filenameExt || (contentType.includes("mpegurl") ? "m3u8" : contentType.includes("dash") ? "mpd" : "unknown");
          const result: SniffResult = {
            url: responseUrl,
            ext: finalExt,
            type: contentType.split(";")[0],
            size: contentLength,
            source: "network",
            headers,
            requestHeaders: requestHeadersMap.get(responseUrl),
            filename: filename ?? undefined,
          };

          // 文件大小过滤
          let passSizeFilter = true;
          if (sizeFilter) {
            passSizeFilter = matchSizeFilter(size, sizeFilter);
          } else if (minSize > 0) {
            passSizeFilter = size >= minSize;
          }

          // L1 优先：如果已存在，覆盖（因为 L1 有完整的请求头）
          if (passSizeFilter) {
            resultsMap.set(responseUrl, result);
          }
        }
      } catch {
        // 忽略解析错误
      }
    });

    // ===== L3: 深度搜索 - 注入 Hook 脚本 =====
    // 暴露回调函数给页面脚本
    await page.exposeFunction("__ccSnifferCallback", (data: any) => {
      // 处理密钥上报
      if (data.action === "ccSnifferAddKey" && data.key) {
        keys.push({ key: data.key, source: data.source || "unknown" });
        return;
      }

      // 过滤误报
      if (data.url && isFalsePositive(data.url, data.ext)) return;

      if (data.url && isValidHttpUrl(data.url)) {
        // 只在 L1 未捕获时才添加（L1 优先，因为有完整请求头）
        if (!resultsMap.has(data.url)) {
          resultsMap.set(data.url, {
            url: data.url,
            ext: data.ext,
            type: "",
            size: "0",
            source: data.source,
            content: data.content,
          });
        }
      }
      // 无 URL 但有 m3u8 内容的情况，暂不收集（容易误报）
    });

    // 在页面加载前注入深度搜索脚本
    await page.evaluateOnNewDocument(DEEP_SEARCH_SCRIPT);

    // ===== 访问目标页面 =====
    console.error(`[嗅探] 正在访问：${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // 页面加载后再次注入 Hook（确保不被浏览器重置）
    await page.evaluate(DEEP_SEARCH_SCRIPT);

    // 等待网络空闲
    console.error(`[嗅探] 等待网络空闲 (${networkIdleTime}ms)...`);
    await page.waitForNetworkIdle({
      idleTime: networkIdleTime,
      timeout: networkIdleTime + 5000,
    }).catch(() => {
      // 超时也继续
    });

    // 额外等待，让 JS 动态加载的资源有时间出现
    console.error(`[嗅探] 额外等待 ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // 如果是交互模式，等待用户手动操作
    if (interactive) {
      console.error("[嗅探] 进入交互模式，请在浏览器中操作，完成后按 Enter 继续...");
      await new Promise<void>(resolve => {
        process.stdin.once("data", () => resolve());
      });
    }

    // 再次等待网络空闲，捕获交互后产生的新请求
    await page.waitForNetworkIdle({
      idleTime: 2000,
      timeout: 5000,
    }).catch(() => {});

    await new Promise(resolve => setTimeout(resolve, 2000));

    const results = Array.from(resultsMap.values());

    // 将密钥附加到 m3u8 资源上
    if (keys.length > 0) {
      console.error(`[嗅探] 发现 ${keys.length} 个潜在密钥`);
      for (const result of results) {
        if (result.ext === "m3u8" || result.ext === "m3u") {
          result.keys = keys.map(k => k.key);
        }
      }
    }

    console.error(`[嗅探] 共发现 ${results.length} 个媒体资源`);

    return results;
  } finally {
    await browser.close();
  }
}
