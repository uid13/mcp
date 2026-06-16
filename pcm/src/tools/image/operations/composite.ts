/**
 * 图片叠加/水印
 */

import { z } from "zod";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import type { OperationDef } from "../types.js";

const schema = z.object({
  input: z.string().describe("叠加图片的本地文件路径"),
  gravity: z.enum([
    "center", "north", "south", "east", "west",
    "northeast", "northwest", "southeast", "southwest",
  ]).optional().default("southeast").describe("叠加位置"),
});

export const composite: OperationDef<typeof schema> = {
  description: "叠加图片（水印），将另一张图片叠加到指定位置",
  schema,
  handler: (pipeline, { input, gravity }) =>
    pipeline.composite([{ input: resolve(input), gravity }]),
};

/** 校验 composite 操作的叠加图片是否存在 */
export async function validateCompositeInput(inputPath: string): Promise<void> {
  const absPath = resolve(inputPath);
  try {
    await access(absPath);
  } catch {
    throw new Error(`叠加图片不存在: ${absPath}`);
  }
}
