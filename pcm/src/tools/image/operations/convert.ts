/**
 * 格式转换（作为操作链中的一步）
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  format: z.enum(["jpeg", "png", "webp", "avif"]).describe("目标格式"),
  quality: z.number().int().min(1).max(100).optional().default(80).describe("输出质量"),
});

export const convert: OperationDef<typeof schema> = {
  description: "转换图片格式，可指定质量",
  schema,
  handler: (pipeline, { format, quality }) => {
    switch (format) {
      case "jpeg": return pipeline.jpeg({ quality });
      case "png": return pipeline.png({ quality });
      case "webp": return pipeline.webp({ quality });
      case "avif": return pipeline.avif({ quality });
    }
  },
};
