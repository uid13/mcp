/**
 * 调整图片尺寸
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  width: z.number().int().positive().optional().describe("目标宽度（像素）"),
  height: z.number().int().positive().optional().describe("目标高度（像素）"),
  fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional().default("contain").describe("适配模式"),
});

export const resize: OperationDef<typeof schema> = {
  description: "调整图片尺寸，支持指定宽高和适配模式",
  schema,
  handler: (pipeline, { width, height, fit }) => pipeline.resize(width, height, { fit }),
};
