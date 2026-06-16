/**
 * 旋转图片
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  angle: z.number().default(90).describe("旋转角度（度）"),
});

export const rotate: OperationDef<typeof schema> = {
  description: "旋转图片指定角度",
  schema,
  handler: (pipeline, { angle }) => pipeline.rotate(angle),
};
