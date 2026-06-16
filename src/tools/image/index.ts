/**
 * 图片处理工具
 * 基于策略模式 + 注册表 + reduce 管道，支持操作链模式
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, parse, join } from "node:path";
import { operations } from "./registry.js";
import { validateCompositeInput } from "./operations/composite.js";

/** 生成输出文件路径，避免覆盖原文件 */
function generateOutputPath(inputPath: string, suffix: string, newExt?: string): string {
  const parsed = parse(inputPath);
  const ext = newExt ?? parsed.ext;
  return join(parsed.dir, `${parsed.name}${suffix}${ext}`);
}

export function registerImageTools(server: FastMCP): void {

  // 能力暴露：返回所有可用操作及其参数定义
  server.addTool({
    name: "image_capabilities",
    description: "获取图片处理支持的所有操作及其参数定义，用于构造 image_process 的 operations 数组",
    parameters: z.object({}),
    execute: async () => {
      const capabilities = Object.entries(operations).map(([name, def]) => ({
        name,
        description: def.description,
        parameters: zodToJsonSchema(def.schema),
      }));
      return JSON.stringify(capabilities, null, 2);
    },
  });

  // 图片元数据
  server.addTool({
    name: "image_info",
    description: "获取图片元数据（尺寸、格式、色彩空间等）",
    parameters: z.object({
      inputPath: z.string().describe("图片的本地文件路径"),
    }),
    execute: async ({ inputPath }) => {
      const absPath = resolve(inputPath);
      const buffer = await readFile(absPath);
      const metadata = await sharp(buffer).metadata();

      return JSON.stringify({
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        hasProfile: metadata.hasProfile,
        orientation: metadata.orientation,
      }, null, 2);
    },
  });

  // 通用操作链
  server.addTool({
    name: "image_process",
    description: "执行图片操作链。先调用 image_capabilities 了解可用操作，然后构造 operations 数组按顺序执行。",
    parameters: z.object({
      inputPath: z.string().describe("输入图片的本地文件路径"),
      operations: z.array(z.object({
        type: z.string().describe("操作类型，参考 image_capabilities 返回的 name"),
      }).passthrough()).describe("操作数组，按顺序执行"),
      outputPath: z.string().optional().describe("输出路径，不传则自动生成（原文件名_processed.ext）"),
    }),
    execute: async ({ inputPath, operations: ops, outputPath }) => {
      const absPath = resolve(inputPath);
      const buffer = await readFile(absPath);

      // 校验 composite 操作的叠加图片是否存在
      for (const op of ops) {
        if (op.type === "composite" && "input" in op) {
          await validateCompositeInput((op as { input: string }).input);
        }
      }

      // reduce 管道：按顺序应用每个操作，记录最后一个 convert 的格式
      let lastConvertFormat: string | undefined;
      const pipeline = ops.reduce(
        (pipe, op) => {
          const def = operations[op.type];
          if (!def) throw new Error(`未知操作: ${op.type}，请先调用 image_capabilities 查看可用操作`);
          const params = def.schema.parse(op);
          if (op.type === "convert" && "format" in params) {
            lastConvertFormat = (params as { format: string }).format;
          }
          return def.handler(pipe, params);
        },
        sharp(buffer),
      );

      const outBuffer = await pipeline.toBuffer();
      const info = await sharp(outBuffer).metadata();

      // 推断输出扩展名：如果操作链包含 convert，用目标格式；否则保持原格式
      const finalExt = lastConvertFormat ? `.${lastConvertFormat}` : undefined;
      
      // 校验 outputPath：如果与 inputPath 相同则忽略，防止覆盖原图
      const resolvedOutput = outputPath ? resolve(outputPath) : undefined;
      const outPath = resolvedOutput && resolvedOutput !== absPath
        ? resolvedOutput
        : resolve(generateOutputPath(absPath, "_processed", finalExt));
      await writeFile(outPath, outBuffer);

      return JSON.stringify({
        outputPath: outPath,
        width: info.width,
        height: info.height,
        format: info.format,
        operationsApplied: ops.map((op) => op.type),
      }, null, 2);
    },
  });
}
