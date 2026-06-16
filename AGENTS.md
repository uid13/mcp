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
│   ├── tools/
│   │   └── si.ts       # 系统信息工具（使用 Nunjucks 模板）
│   └── templates/      # Nunjucks 模板目录
│       ├── system-dashboard.njk
│       ├── cpu-usage.njk
│       ├── memory-chart.njk
│       ├── disk-chart.njk
│       └── network-chart.njk
└── dist/               # 构建输出（git 忽略）
    ├── index.js
    └── templates/      # 构建时自动复制
```

## 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| FastMCP | ^4.3.0 | MCP 服务框架 |
| Nunjucks | ^3.2.4 | 模板引擎（生成 Mermaid 图表） |
| systeminformation | ^5.31.7 | 系统信息采集 |
| Zod | ^3.25.76 | 参数验证 |
| Vite | ^8.0.0 | 构建工具（SSR 模式） |
| TypeScript | ^5.9.0 | 类型系统 |

## 开发环境

- Node.js >= 18
- pnpm >= 9

## 开发规范

### 代码风格

1. **使用 TypeScript 严格模式**
2. **命名规范**
   - 工具名称：`snake_case`（如 `get_system_dashboard`）
   - 函数名称：`camelCase`（如 `registerSiTools`）
   - 模板文件：`kebab-case`（如 `cpu-usage.njk`）
3. **文件组织**
   - 工具实现在 `src/tools/si.ts`
   - 模板文件在 `src/templates/`
   - 模板与逻辑分离，修改图表样式只需编辑 `.njk` 文件

### MCP 工具开发

使用 FastMCP 框架注册工具：

```typescript
import { FastMCP } from "fastmcp";
import { z } from "zod";
import nunjucks from "nunjucks";

export function registerSiTools(server: FastMCP): void {
  server.addTool({
    name: "get_example",
    description: "示例工具描述",
    parameters: z.object({
      // 参数定义（可选）
    }),
    execute: async () => {
      // 使用 Nunjucks 渲染模板
      return nunjucks.render("example.njk", { data: "value" });
    },
  });
}
```

### Nunjucks 模板开发

模板文件放在 `src/templates/` 目录，使用 `{{ }}` 插值和 `{% %}` 控制流：

```njk
# 标题

```mermaid
pie title 图表标题
{% for item in items %}
    "{{ item.icon }} {{ item.name }}" : {{ item.value }}
{% endfor %}
```

| 列1 | 列2 |
|-----|-----|
{% for row in rows %}
| {{ row.col1 }} | {{ row.col2 }} |
{% endfor %}
```

### 错误处理

工具执行失败时抛出异常，FastMCP 会自动处理并返回错误信息：

```typescript
try {
  const data = await fetchData();
  return nunjucks.render("template.njk", { data });
} catch (error) {
  throw new Error(`操作失败：${error instanceof Error ? error.message : String(error)}`);
}
```

### 构建

```bash
pnpm build
```

构建后 `dist/` 目录包含：
- `index.js` — 打包后的服务代码（含所有依赖）
- `templates/` — 自动从 `src/templates/` 复制的模板文件

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

### Q: 工具执行报错 `template not found`

A: 确认 `dist/templates/` 目录下有对应的 `.njk` 文件。重新执行 `pnpm build` 确保模板已复制。

### Q: Inspector 连接报错 `ENOENT`

A: Arguments 中必须使用正斜杠 `/`，Windows 的 `\` 会被转义。

### Q: 修改代码后不生效

A: 需要重新 `pnpm build`，然后关闭 Inspector（`Ctrl+C`）重新执行 `npx fastmcp inspect dist/index.js`。

### Q: 如何添加新工具

A: 在 `src/tools/si.ts` 的 `registerSiTools` 函数中添加 `server.addTool()` 调用，同时在 `src/templates/` 创建对应模板文件。

## 参考资源

- [FastMCP 文档](https://github.com/punkpeye/fastmcp)
- [Nunjucks 文档](https://mozilla.github.io/nunjucks/)
- [systeminformation 文档](https://systeminformation.io/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
