/**
 * Iconify 图标搜索工具
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import { searchIcons } from "./search.js";
import { buildRenderGuide } from "./render-guide.js";

/**
 * 注册 Iconify 图标搜索工具到 MCP 服务器
 */
export function registerIconifyTools(server: FastMCP): void {
  server.addTool({
    name: "icon_search",
    description:
      "搜索 Iconify 图标库中的图标。返回 JSON，含搜索结果和 renderGuide 渲染指引。支持按图标集、分类、彩色/单色过滤。",
    parameters: z.object({
      query: z.string().min(1).describe("搜索关键词，例如 home、arrow、github"),
      limit: z
        .number()
        .int()
        .min(32)
        .max(999)
        .optional()
        .default(64)
        .describe("返回数量，范围 32~999，默认 64"),
      start: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe("分页起始位置，默认 0"),
      prefix: z
        .string()
        .optional()
        .describe("限定单个图标集前缀，如 mdi"),
      prefixes: z
        .string()
        .optional()
        .describe("限定多个图标集前缀，逗号分隔，如 mdi,fa"),
      category: z
        .string()
        .optional()
        .describe(
          "按分类过滤，如 General、Emoji、Brands / Social、Thematic、Animated Icons 等",
        ),
      palette: z
        .enum(["color", "mono"])
        .optional()
        .describe(
          "按色彩过滤：color 只返回彩色/多色图标，mono 只返回单色图标",
        ),
    }),
    execute: async ({
      query,
      limit,
      start,
      prefix,
      prefixes,
      category,
      palette,
    }) => {
      try {
        const result = await searchIcons({
          query,
          limit,
          start,
          prefix,
          prefixes,
          category,
          palette,
        });

        return JSON.stringify(
          {
            renderGuide: buildRenderGuide(),
            icons: result.icons,
            total: result.total,
            originalTotal: result.originalTotal,
            limit: result.limit,
            start: result.start,
            filtered: result.filtered,
            palette,
            collections: result.collections,
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
