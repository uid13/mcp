/**
 * m3u8 下载器
 * 负责 m3u8dl 路径检测、下载命令生成、m3u8 智能选择
 */

import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import UserAgent from "user-agents";
import which from "which";
import type { SniffResult } from "./sniffer.js";

/** 默认下载目录 */
export const DEFAULT_DOWNLOAD_DIR = join(homedir(), "Downloads", "cc-sniffer");

/**
 * 智能选择最佳 m3u8 链接
 * 策略：排除 Master Playlist，按 URL 路径深度排序，Fallback 到最后一个
 */
export async function selectBestM3u8(list: SniffResult[]): Promise<SniffResult> {
  if (list.length === 0) {
    throw new Error("m3u8 列表为空");
  }
  if (list.length === 1) {
    return list[0];
  }

  // 策略 1: 尝试获取内容，排除 Master Playlist（包含 #EXT-X-STREAM-INF）
  const mediaPlaylists: SniffResult[] = [];

  for (const item of list) {
    if (!item.url) continue;
    try {
      const ua =
        UserAgent.random({ deviceCategory: "desktop", userAgent: /Chrome/ }) ??
        new UserAgent();

      const headers: Record<string, string> = {
        "User-Agent": ua.toString(),
      };
      if (item.requestHeaders?.["referer"]) {
        headers["Referer"] = item.requestHeaders["referer"];
      }
      if (item.requestHeaders?.["origin"]) {
        headers["Origin"] = item.requestHeaders["origin"];
      }

      const response = await fetch(item.url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000),
      });
      const text = await response.text();
      // Master Playlist 指向子播放列表，不是实际视频，跳过
      if (text.includes("#EXT-X-STREAM-INF")) {
        continue;
      }
      mediaPlaylists.push(item);
    } catch {
      mediaPlaylists.push(item);
    }
  }

  const candidates =
    mediaPlaylists.length > 0 ? mediaPlaylists : list;

  // 策略 2: 按 URL 路径深度排序
  candidates.sort((a, b) => {
    const depthA = (a.url.match(/\//g) || []).length;
    const depthB = (b.url.match(/\//g) || []).length;
    return depthB - depthA;
  });

  // 策略 3: 深度相同时选 URL 更长的
  if (candidates.length > 1) {
    const maxDepth = (candidates[0].url.match(/\//g) || []).length;
    const sameDepth = candidates.filter(
      (r) => (r.url.match(/\//g) || []).length === maxDepth,
    );
    if (sameDepth.length > 1) {
      sameDepth.sort((a, b) => b.url.length - a.url.length);
      return sameDepth[0];
    }
  }

  return candidates[0];
}

/**
 * 获取 m3u8dl 可执行文件路径
 * 三级检测：环境变量 → which PATH → 常见安装路径
 */
export function getM3u8dlPath(): string {
  const os = platform();
  const ext = os === "win32" ? ".exe" : "";

  // 第一优先：环境变量
  const envPath = process.env.M3U8DL_PATH;
  if (envPath && existsSync(envPath)) {
    return envPath;
  }

  // 第二优先：which 在 PATH 中查找（尝试多个常见名称）
  const candidateNames = ["N_m3u8DL-RE", "m3u8", "m3u8dl"];
  for (const name of candidateNames) {
    const whichPath = which.sync(name, { nothrow: true });
    if (whichPath) return whichPath;
  }

  // 第三优先：回退到常见安装路径
  const exeName = `N_m3u8DL-RE${ext}`;
  const fallbackPaths =
    os === "win32"
      ? [
          join(
            homedir(),
            ".local",
            "share",
            "mise",
            "data",
            "installs",
            "github-nilaoda-n-m3u8-dl-re",
            "0.5.1-beta",
            `m3u8${ext}`,
          ),
          "D:\\mise\\data\\installs\\github-nilaoda-n-m3u8-dl-re\\0.5.1-beta\\m3u8.exe",
          "C:\\Program Files\\N_m3u8DL-RE\\N_m3u8DL-RE.exe",
        ]
      : [
          join(
            homedir(),
            ".local",
            "share",
            "mise",
            "data",
            "installs",
            "github-nilaoda-n-m3u8-dl-re",
            "0.5.1-beta",
            exeName,
          ),
          join(homedir(), ".local", "bin", exeName),
          "/usr/local/bin/" + exeName,
          "/opt/N_m3u8DL-RE/" + exeName,
        ];

  for (const p of fallbackPaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  throw new Error(
    "未找到 N_m3u8DL-RE 可执行文件。\n" +
      "请通过以下方式之一解决：\n" +
      "1. 设置环境变量 M3U8DL_PATH 指向你的可执行文件路径\n" +
      "2. 将 N_m3u8DL-RE 添加到系统 PATH\n" +
      "3. 从 https://github.com/nilaoda/N_m3u8DL-RE/releases 下载并安装",
  );
}

/**
 * 生成 m3u8dl 下载命令（不执行，仅返回命令文本）
 */
export interface DownloadCommand {
  exePath: string;         // m3u8dl 可执行文件路径
  args: string[];          // 参数数组
  powershell: string;      // Windows PowerShell 命令文本（已转义）
  shell: string;           // Unix shell 命令文本（已转义）
}

/**
 * 对 PowerShell 字符串参数做转义并包裹双引号
 */
function quoteForPowershell(arg: string): string {
  // 转义顺序：反引号 → 美元符 → 双引号 → 换行
  const escaped = arg
    .replace(/`/g, '``')
    .replace(/\$/g, '`$')
    .replace(/"/g, '`"')
    .replace(/\n/g, '`n');
  return `"${escaped}"`;
}

/**
 * 对 Unix shell 字符串参数做转义并包裹单引号
 */
function quoteForShell(arg: string): string {
  // 单引号内无法包含单引号，用结束引号 + 转义引号 + 重新开始的方式
  const escaped = arg.replace(/'/g, "'\\''");
  return `'${escaped}'`;
}

/**
 * 生成 m3u8dl 下载命令（不执行，仅返回命令文本）
 */
export function buildDownloadCommand(
  m3u8Url: string,
  outputDir: string,
  fileName?: string,
  referer?: string,
  origin?: string,
): DownloadCommand {
  const exePath = getM3u8dlPath();

  // 生成随机桌面端 Chrome User-Agent（与嗅探逻辑保持一致）
  const ua =
    UserAgent.random({ deviceCategory: "desktop", userAgent: /Chrome/ }) ??
    new UserAgent();

  // 新版 N_m3u8DL-RE 使用位置参数 <input>，而非 -i 标志
  const args: string[] = [
    m3u8Url,
    "--save-dir", outputDir,
    // 优化参数：加速下载
    "-H", `User-Agent: ${ua.toString()}`,  // 设置随机桌面端 Chrome User-Agent
  ];
  // 可选请求头：从 sniff 结果的 requestHeaders 中透传
  if (referer) {
    args.push("-H", `Referer: ${referer}`);
  }
  if (origin) {
    args.push("-H", `Origin: ${origin}`);
  }
  args.push(
    "--thread-count", "16",              // 下载线程数（默认 8，提升到 16）
    "--download-retry-count", "5",       // 重试次数（默认 3，提升到 5）
    "--http-request-timeout", "120",     // HTTP 超时秒数（默认 100，提升到 120）
    "-mt",                               // 并发下载音视频字幕
    "--no-log",                          // 关闭日志文件输出，减少 IO
    "--log-level", "ERROR",              // 只显示错误日志
    "--del-after-done",                  // 完成后删除临时文件（默认已开启，显式声明）
  );
  if (fileName) {
    args.push("--save-name", fileName);
  }

  // 生成功率外壳格式：& "exePath" "arg1" "arg2" ...
  const powershellArgs = [quoteForPowershell(exePath), ...args.map(quoteForPowershell)];
  const powershell = `& ${powershellArgs.join(" ")}`;

  // 生成 Unix shell 格式：'exePath' 'arg1' 'arg2' ...
  const shellArgs = [quoteForShell(exePath), ...args.map(quoteForShell)];
  const shell = shellArgs.join(" ");

  return { exePath, args, powershell, shell };
}
