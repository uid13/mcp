/**
 * 图片操作类型定义
 */

import type { z } from "zod";
import type sharp from "sharp";

/** 操作定义：包含描述、参数 schema 和处理函数 */
export interface OperationDef<T extends z.ZodType = z.ZodType> {
  /** 操作说明 */
  description: string;
  /** 参数校验 schema */
  schema: T;
  /** 处理函数：接收 pipeline 和已校验的参数，返回 pipeline */
  handler: (pipeline: sharp.Sharp, params: z.infer<T>) => sharp.Sharp;
}
