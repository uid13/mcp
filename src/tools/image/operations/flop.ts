/**
 * 水平翻转
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({});

export const flop: OperationDef<typeof schema> = {
  description: "水平翻转图片（左右镜像）",
  schema,
  handler: (pipeline) => pipeline.flop(),
};
