/**
 * 自动裁掉边缘空白/纯色区域
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  threshold: z.number().nonnegative().optional().describe("颜色差异阈值，默认 10"),
});

export const trim: OperationDef<typeof schema> = {
  description: "自动裁掉边缘空白或纯色区域",
  schema,
  handler: (pipeline, { threshold }) => pipeline.trim(threshold !== undefined ? { threshold } : undefined),
};
