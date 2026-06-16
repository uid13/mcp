/**
 * 灰度化
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({});

export const greyscale: OperationDef<typeof schema> = {
  description: "将图片转为灰度",
  schema,
  handler: (pipeline) => pipeline.greyscale(),
};
