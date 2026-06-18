/**
 * 视频嗅探工具
 * 提供视频嗅探 + m3u8 下载一体化功能
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import { sniffMedia } from "./sniffer.js";
import { DEFAULT_DOWNLOAD_DIR, selectBestM3u8, buildDownloadCommand } from "./downloader.js";

/**
 * 注册视频嗅探工具到 MCP 服务器
 */
export function registerCcTools(server: FastMCP): void {
  // ===== 工具 1: 嗅探媒体资源 =====
  server.addTool({
    name: "sniff",
    description:
      "嗅探网页中的视频/音频资源地址。返回 JSON，含 selected 最佳 m3u8（含 requestHeaders）和完整媒体资源列表。",
    parameters: z.object({
      url: z
        .string()
        .describe("目标网页 URL，例如 https://www.dcc3.com/play/15487-3-87/"),
      waitTime: z
        .number()
        .optional()
        .describe("额外等待时间 (毫秒)，默认 8000。视频加载慢时可增大"),
      headless: z
        .boolean()
        .optional()
        .describe(
          "是否无头模式运行浏览器，默认 true。设为 false 可看到浏览器窗口",
        ),
      networkIdleTime: z
        .number()
        .optional()
        .describe("网络空闲等待时间 (毫秒)，默认 3000"),
      showAll: z
        .boolean()
        .optional()
        .describe(
          "是否显示所有资源（含 .ts 分片），默认 false 只显示 m3u8/mp4/mpd",
        ),
    }),
    execute: async ({ url, waitTime, headless, networkIdleTime, showAll }) => {
      try {
        const results = await sniffMedia({
          url,
          waitTime,
          headless,
          networkIdleTime,
        });

        const m3u8List = results.filter(
          (r) => r.ext === "m3u8" || r.ext === "m3u",
        );
        const mp4List = results.filter((r) => r.ext === "mp4");
        const mpdList = results.filter((r) => r.ext === "mpd");
        const otherList = showAll
          ? results.filter(
              (r) => !["m3u8", "m3u", "mp4", "mpd"].includes(r.ext),
            )
          : [];

        // 自动选择最佳 m3u8
        let selected = null;
        if (m3u8List.length > 0) {
          try {
            const best = await selectBestM3u8(m3u8List);
            selected = {
              url: best.url,
              ext: best.ext,
              source: best.source,
              size: best.size,
              requestHeaders: {
                ...(best.requestHeaders?.referer
                  ? { referer: best.requestHeaders.referer }
                  : {}),
                ...(best.requestHeaders?.origin
                  ? { origin: best.requestHeaders.origin }
                  : {}),
              },
            };
          } catch {
            // 选择失败时默认取第一个
            selected = {
              url: m3u8List[0].url,
              ext: m3u8List[0].ext,
              source: m3u8List[0].source,
              size: m3u8List[0].size,
              requestHeaders: {},
            };
          }
        }

        return JSON.stringify(
          {
            selected,
            stats: {
              total: results.length,
              m3u8: m3u8List.length,
              mp4: mp4List.length,
              mpd: mpdList.length,
              other: otherList.length,
            },
            m3u8List: m3u8List.map((r) => ({
              url: r.url,
              ext: r.ext,
              size: r.size,
              source: r.source,
            })),
            mp4List: mp4List.map((r) => ({
              url: r.url,
              ext: r.ext,
              size: r.size,
              source: r.source,
            })),
            mpdList: mpdList.map((r) => ({
              url: r.url,
              ext: r.ext,
              size: r.size,
              source: r.source,
            })),
            otherList: otherList.map((r) => ({
              url: r.url,
              ext: r.ext,
              size: r.size,
              source: r.source,
            })),
          },
          null,
          2,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return JSON.stringify(
          {
            selected: null,
            stats: { total: 0, m3u8: 0, mp4: 0, mpd: 0, other: 0 },
            m3u8List: [],
            mp4List: [],
            mpdList: [],
            otherList: [],
            error: msg,
          },
          null,
          2,
        );
      }
    },
  });

  // ===== 工具 2: 直接下载 m3u8 =====
  server.addTool({
    name: "download-m3u8",
    description:
      "生成 m3u8dl 下载命令（含优化参数），返回 JSON。支持传入 sniff 结果中的 referer/origin 请求头。",
    parameters: z.object({
      m3u8Url: z.string().describe("m3u8 链接地址"),
      referer: z
        .string()
        .optional()
        .describe(
          "Referer 头（从 sniff 结果的 selected.requestHeaders.referer 获取）",
        ),
      origin: z
        .string()
        .optional()
        .describe(
          "Origin 头（从 sniff 结果的 selected.requestHeaders.origin 获取）",
        ),
      outputDir: z
        .string()
        .optional()
        .describe(`下载保存目录，默认 ${DEFAULT_DOWNLOAD_DIR}`),
      fileName: z
        .string()
        .optional()
        .describe("保存文件名（不含扩展名）"),
    }),
    execute: async ({ m3u8Url, referer, origin, outputDir, fileName }) => {
      try {
        const saveDir = outputDir || DEFAULT_DOWNLOAD_DIR;
        const cmd = buildDownloadCommand(
          m3u8Url,
          saveDir,
          fileName,
          referer,
          origin,
        );
        const isWin = process.platform === "win32";
        const cmdText = isWin ? cmd.powershell : cmd.shell;

        return JSON.stringify(
          {
            command: cmdText,
            m3u8Url,
            saveDir,
            exePath: cmd.exePath,
            shell: isWin ? "powershell" : "bash",
          },
          null,
          2,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return JSON.stringify({ error: msg }, null, 2);
      }
    },
  });
}
