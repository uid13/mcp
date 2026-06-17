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
      "嗅探网页中的视频/音频资源地址。输入网页 URL，返回所有嗅探到的 m3u8/mp4 等媒体资源列表。",
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
        const otherList = results.filter(
          (r) => !["m3u8", "m3u", "mp4", "mpd"].includes(r.ext),
        );

        let output = `## 嗅探结果\n\n共发现 **${results.length}** 个媒体资源\n\n`;

        if (m3u8List.length > 0) {
          output += `### M3U8 资源 (${m3u8List.length}个)\n\n`;
          m3u8List.forEach((r, i) => {
            output += `${i + 1}. \`${r.url}\`\n`;
          });
          output += "\n";
        }

        if (mp4List.length > 0) {
          output += `### MP4 资源 (${mp4List.length}个)\n\n`;
          mp4List.forEach((r, i) => {
            output += `${i + 1}. \`${r.url}\`\n`;
          });
          output += "\n";
        }

        if (mpdList.length > 0) {
          output += `### MPD 资源 (${mpdList.length}个)\n\n`;
          mpdList.forEach((r, i) => {
            output += `${i + 1}. \`${r.url}\`\n`;
          });
          output += "\n";
        }

        if (showAll && otherList.length > 0) {
          output += `### 其他资源 (${otherList.length}个)\n\n`;
          otherList.forEach((r, i) => {
            output += `${i + 1}. [${r.ext}] \`${r.url}\`\n`;
          });
          output += "\n";
        } else if (otherList.length > 0) {
          output += `> 另有 ${otherList.length} 个其他类型资源（.ts 分片等），设置 showAll=true 可查看\n\n`;
        }

        return output;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return `嗅探失败：${msg}`;
      }
    },
  });

  // ===== 工具 2: 嗅探并下载 =====
  server.addTool({
    name: "sniff-and-download",
    description:
      "嗅探网页中的视频资源并生成下载命令。输入网页 URL，自动嗅探 m3u8 地址并生成 m3u8dl 下载命令。",
    parameters: z.object({
      url: z.string().describe("目标网页 URL"),
      waitTime: z
        .number()
        .optional()
        .describe("额外等待时间 (毫秒)，默认 8000"),
      headless: z
        .boolean()
        .optional()
        .describe("是否无头模式，默认 true"),
      outputDir: z
        .string()
        .optional()
        .describe(`下载保存目录，默认 ${DEFAULT_DOWNLOAD_DIR}`),
      fileName: z
        .string()
        .optional()
        .describe("保存文件名（不含扩展名）"),
      autoSelect: z
        .boolean()
        .optional()
        .describe(
          "是否自动选择最佳 m3u8 链接生成下载命令，默认 true。设为 false 则只返回列表",
        ),
    }),
    execute: async ({
      url,
      waitTime,
      headless,
      outputDir,
      fileName,
      autoSelect,
    }) => {
      try {
        const saveDir = outputDir || DEFAULT_DOWNLOAD_DIR;

        const results = await sniffMedia({
          url,
          waitTime,
          headless,
        });

        const m3u8List = results.filter(
          (r) => r.ext === "m3u8" || r.ext === "m3u",
        );

        if (m3u8List.length === 0) {
          return (
            `未嗅探到 m3u8 资源。共发现 ${results.length} 个其他媒体资源。\n\n` +
            results
              .filter((r) => ["mp4", "mpd"].includes(r.ext))
              .map((r, i) => `${i + 1}. [${r.ext}] \`${r.url}\``)
              .join("\n")
          );
        }

        const target = await selectBestM3u8(m3u8List);

        if (!autoSelect) {
          let output = `发现 ${m3u8List.length} 个 m3u8 资源，请选择:\n\n`;
          m3u8List.forEach((r, i) => {
            output += `${i + 1}. \`${r.url}\` (${r.size} bytes)\n`;
          });
          return output;
        }

        const cmd = buildDownloadCommand(target.url, saveDir, fileName);
        const isWin = process.platform === "win32";
        const cmdText = isWin ? cmd.powershell : cmd.shell;
        const lang = isWin ? "powershell" : "bash";

        let output = `## 嗅探结果\n\n`;
        output += `选中资源：\`${target.url}\`\n\n`;
        output += `来源：${target.source}\n`;
        output += `大小：${target.size} bytes\n`;
        output += `保存目录：\`${saveDir}\`\n\n`;
        output += `## 下载命令\n\n`;
        output += `请复制以下命令在终端中执行：\n\n`;
        output += `\`\`\`${lang}\n${cmdText}\n\`\`\`\n`;
        output += `\n> 提示：命令中已包含优化参数（多线程、重试、超时等），可直接运行`;

        return output;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return `操作失败：${msg}`;
      }
    },
  });

  // ===== 工具 3: 直接下载 m3u8 =====
  server.addTool({
    name: "download-m3u8",
    description: "生成 m3u8dl 下载命令（含优化参数），复制到终端执行即可下载，无需嗅探。",
    parameters: z.object({
      m3u8Url: z.string().describe("m3u8 链接地址"),
      outputDir: z
        .string()
        .optional()
        .describe(`下载保存目录，默认 ${DEFAULT_DOWNLOAD_DIR}`),
      fileName: z
        .string()
        .optional()
        .describe("保存文件名（不含扩展名）"),
    }),
    execute: async ({ m3u8Url, outputDir, fileName }) => {
      try {
        const saveDir = outputDir || DEFAULT_DOWNLOAD_DIR;
        const cmd = buildDownloadCommand(m3u8Url, saveDir, fileName);
        const isWin = process.platform === "win32";
        const cmdText = isWin ? cmd.powershell : cmd.shell;
        const lang = isWin ? "powershell" : "bash";

        let output = `## 下载命令\n\n`;
        output += `- m3u8 URL: \`${m3u8Url}\`\n`;
        output += `- 保存目录：\`${saveDir}\`\n\n`;
        output += `请复制以下命令在终端中执行：\n\n`;
        output += `\`\`\`${lang}\n${cmdText}\n\`\`\`\n`;
        output += `\n> 提示：命令中已包含优化参数（多线程、重试、超时等），可直接运行`;

        return output;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return `操作失败：${msg}`;
      }
    },
  });
}
