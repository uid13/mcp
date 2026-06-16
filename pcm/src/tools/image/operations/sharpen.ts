/**
 * 锐化图片
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  sigma: z.number().min(0.000001).max(10).optional().describe("高斯 sigma 值，不传则使用轻度锐化"),
});

export const sharpen: OperationDef<typeof schema> = {
  description: "锐化图片",
  schema,
  handler: (pipeline, { sigma }) => pipeline.sharpen(sigma ? { sigma } : undefined),
};
