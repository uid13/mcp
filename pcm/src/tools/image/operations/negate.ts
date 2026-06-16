/**
 * 反色
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({});

export const negate: OperationDef<typeof schema> = {
  description: "反色（负片效果）",
  schema,
  handler: (pipeline) => pipeline.negate(),
};
