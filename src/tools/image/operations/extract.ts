/**
 * 裁剪图片（提取矩形区域）
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  left: z.number().int().nonnegative().describe("左边界（像素）"),
  top: z.number().int().nonnegative().describe("上边界（像素）"),
  width: z.number().int().positive().describe("裁剪宽度（像素）"),
  height: z.number().int().positive().describe("裁剪高度（像素）"),
});

export const extract: OperationDef<typeof schema> = {
  description: "裁剪图片，提取指定矩形区域",
  schema,
  handler: (pipeline, { left, top, width, height }) => pipeline.extract({ left, top, width, height }),
};
