/**
 * 对比度增强（直方图归一化）
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({});

export const normalize: OperationDef<typeof schema> = {
  description: "对比度增强（直方图归一化）",
  schema,
  handler: (pipeline) => pipeline.normalize(),
};
