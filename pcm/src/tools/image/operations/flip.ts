/**
 * 垂直翻转
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({});

export const flip: OperationDef<typeof schema> = {
  description: "垂直翻转图片（上下镜像）",
  schema,
  handler: (pipeline) => pipeline.flip(),
};
