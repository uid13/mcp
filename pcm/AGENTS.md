# PCM - Agent 开发指南

## 项目结构

```
pcm/
├── README.md           # 项目说明
├── AGENTS.md           # 本文件
├── package.json        # 依赖配置
├── tsconfig.json       # TypeScript 配置
├── vite.config.ts      # Vite 配置（SSR 模式构建 Node.js 服务）
├── src/
│   ├── index.ts        # MCP 服务入口
│   └── tools/
│       ├── si/
│       │   └── index.ts       # 系统信息工具
│       └── image/
│           ├── types.ts       # 操作类型定义
│           ├── registry.ts    # 操作注册表
│           ├── index.ts       # 图片处理工具
│           └── operations/    # 操作实现
│               ├── resize.ts
│               ├── rotate.ts
│               ├── blur.ts
│               ├── sharpen.ts
│               ├── extract.ts
│               ├── flip.ts
│               ├── flop.ts
│               ├── greyscale.ts
│               ├── negate.ts
│               ├── normalize.ts
│               ├── trim.ts
│               ├── composite.ts
│               └── convert.ts
└── dist/               # 构建输出（git 忽略）
    └── index.js
```

## 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| FastMCP | ^4.3.0 | MCP 服务框架 |
| Sharp | ^0.34.5 | 图片处理 |
| systeminformation | ^5.31.7 | 系统信息采集 |
| Zod | ^3.22.0 | 参数验证 |
| zod-to-json-schema | ^3.24.0 | 生成 JSON Schema |
| Vite | ^8.0.16 | 构建工具（SSR 模式） |
| TypeScript | ^5.0.0 | 类型系统 |

## 开发环境

- Node.js >= 18
- pnpm >= 9

## 开发规范

### 代码风格

1. **使用 TypeScript 严格模式**
2. **命名规范**
   - 工具名称：`snake_case`（如 `get_system_dashboard`、`image_process`）
   - 函数名称：`camelCase`（如 `registerSiTools`、`registerImageTools`）
   - 操作类型：`camelCase`（如 `resize`、`rotate`）
3. **文件组织**
   - 系统工具在 `src/tools/si/index.ts`
   - 图片工具在 `src/tools/image/`
   - 图片操作在 `src/tools/image/operations/`

### MCP 工具开发

使用 FastMCP 框架注册工具：

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";

export function registerExampleTools(server: FastMCP): void {
  server.addTool({
    name: "example_tool",
    description: "示例工具描述",
    parameters: z.object({
      input: z.string().describe("输入参数"),
    }),
    execute: async ({ input }) => {
      // 处理逻辑
      return JSON.stringify({ result: "success" }, null, 2);
    },
  });
}
```

### 图片操作开发

图片处理采用**策略模式 + 注册表 + reduce 管道**架构。

#### 新增操作步骤

1. 在 `src/tools/image/operations/` 创建新文件：

```typescript
/**
 * 操作描述
 */

import { z } from "zod";
import type { OperationDef } from "../types.js";

const schema = z.object({
  param1: z.number().describe("参数说明"),
  param2: z.string().optional().describe("可选参数"),
});

export const operationName: OperationDef<typeof schema> = {
  description: "操作描述，用于 image_capabilities 返回",
  schema,
  handler: (pipeline, { param1, param2 }) => {
    // 调用 sharp 方法
    return pipeline.someSharpMethod(param1);
  },
};
```

2. 在 `src/tools/image/registry.ts` 注册：

```typescript
import { operationName } from "./operations/operationName.js";

export const operations: Record<string, OperationDef> = {
  // ... 其他操作
  operationName,
};
```

3. 无需修改其他文件，`image_capabilities` 会自动暴露新操作。

#### OperationDef 接口

```typescript
interface OperationDef<T extends z.ZodType = z.ZodType> {
  description: string;      // 操作说明
  schema: T;                // 参数校验 schema
  handler: (pipeline: sharp.Sharp, params: z.infer<T>) => sharp.Sharp;
}
```

### 错误处理

工具执行失败时抛出异常，FastMCP 会自动处理并返回错误信息：

```typescript
execute: async ({ inputPath }) => {
  try {
    const buffer = await readFile(inputPath);
    // 处理逻辑
    return JSON.stringify({ result: "success" });
  } catch (error) {
    throw new Error(`操作失败：${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### 构建

```bash
pnpm build
```

构建后 `dist/` 目录包含：
- `index.js` — 打包后的服务代码（含所有依赖）

## 调试

### MCP Inspector

```bash
pnpm build
npx fastmcp inspect dist/index.js
```

浏览器打开后配置：
- **Command**: `node`
- **Arguments**: `D:/AI/mcp/pcm/dist/index.js`（使用正斜杠）

### 日志输出

使用 `console.error` 输出调试信息（不会干扰 MCP 协议）：

```typescript
console.error("[PCM] 调试信息:", data);
```

## 常见问题

### Q: Inspector 连接报错 `ENOENT`

A: Arguments 中必须使用正斜杠 `/`，Windows 的 `\` 会被转义。

### Q: 修改代码后不生效

A: 需要重新 `pnpm build`，然后关闭 Inspector（`Ctrl+C`）重新执行 `npx fastmcp inspect dist/index.js`。

### Q: 如何添加新工具

A: 在对应的工具模块中（如 `src/tools/si/index.ts` 或 `src/tools/image/index.ts`）添加 `server.addTool()` 调用。

### Q: 如何添加新的图片操作

A: 参见上方"图片操作开发"章节，只需在 `operations/` 目录新增文件并在 `registry.ts` 注册。

## 参考资源

- [FastMCP 文档](https://github.com/punkpeye/fastmcp)
- [Sharp 文档](https://sharp.pixelplumbing.com/)
- [systeminformation 文档](https://systeminformation.io/)
- [Zod 文档](https://zod.dev/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
