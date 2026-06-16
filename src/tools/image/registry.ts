/**
 * 操作注册表 — 汇总所有可用操作
 * 新增操作只需：1) 在 operations/ 下新增文件  2) 在此处 import 并加入对象
 */

import type { OperationDef } from "./types.js";

import { resize } from "./operations/resize.js";
import { rotate } from "./operations/rotate.js";
import { blur } from "./operations/blur.js";
import { sharpen } from "./operations/sharpen.js";
import { extract } from "./operations/extract.js";
import { flip } from "./operations/flip.js";
import { flop } from "./operations/flop.js";
import { greyscale } from "./operations/greyscale.js";
import { negate } from "./operations/negate.js";
import { normalize } from "./operations/normalize.js";
import { trim } from "./operations/trim.js";
import { composite } from "./operations/composite.js";
import { convert } from "./operations/convert.js";

/** 所有已注册操作，key 即操作类型名 */
export const operations: Record<string, OperationDef> = {
  resize,
  rotate,
  blur,
  sharpen,
  extract,
  flip,
  flop,
  greyscale,
  negate,
  normalize,
  trim,
  composite,
  convert,
};
