/**
 * 模糊图片
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  sigma: z.number().min(0.3).max(1000).optional().describe("高斯模糊 sigma 值，不传则使用快速 box blur"),
});

export const blur: OperationDef<typeof schema> = {
  description: "模糊图片，支持 box blur 和高斯模糊",
  schema,
  handler: (pipeline, { sigma }) => pipeline.blur(sigma),
};
