# PCM - Personal Computer Manager

个人电脑管家 MCP 服务，提供系统监控和 Mermaid 图表可视化。

## 功能特性

-  **系统仪表盘** - Mermaid 图表可视化系统信息
- 🧠 **CPU 监控** - CPU 核心负载分布图
-  **内存监控** - 内存分配详情图
- 💽 **磁盘监控** - 磁盘使用率详情图
- 🌐 **网络监控** - 网络接口分布图

## 技术栈

- **语言**: TypeScript
- **构建工具**: Vite 8.0.0
- **MCP 框架**: FastMCP 4.3.0
- **模板引擎**: Nunjucks 3.2.4
- **系统信息**: systeminformation 5.31.7
- **参数验证**: Zod 3.25.76

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 运行 MCP 服务

```bash
npm start
```

## 工具列表

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `get_system_dashboard` | 获取系统信息仪表盘，包含内存、磁盘使用率的 Mermaid 饼图，以及软件版本信息 | 无 |
| `get_cpu_usage_chart` | 获取 CPU 各核心使用率的 Mermaid 图表 | 无 |
| `get_memory_chart` | 获取内存使用详细信息的 Mermaid 图表 | 无 |
| `get_disk_chart` | 获取磁盘使用详细信息的 Mermaid 图表 | 无 |
| `get_network_chart` | 获取网络接口信息的 Mermaid 图表 | 无 |

## 项目结构

```
pcm/
├── src/
│   ├── index.ts              # 服务入口
│   ├── tools/
│   │   └── si.ts             # 系统信息工具（使用 Nunjucks 模板）
│   └── templates/            # Nunjucks 模板目录
│       ├── system-dashboard.njk
│       ├── cpu-usage.njk
│       ├── memory-chart.njk
│       ├── disk-chart.njk
│       └── network-chart.njk
── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 使用示例

### 在 Claude Desktop 中使用

```json
{
  "mcpServers": {
    "pcm": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

### 在 Cursor 中使用

```json
{
  "mcpServers": {
    "pcm": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

## 调试与测试

### 使用 MCP Inspector 调试

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) 是官方提供的可视化调试工具，可以测试工具调用、查看请求/响应。

#### 步骤 1：构建项目

```bash
cd D:\AI\mcp\pcm
pnpm build
```

> **注意**：构建后需要确保模板文件已复制到 `dist/templates/` 目录。`package.json` 的 `build` 脚本已自动处理。

#### 步骤 2：启动 Inspector

```bash
npx fastmcp inspect dist/index.js
```

浏览器会自动打开 Inspector 界面（通常是 `http://localhost:6274`）。

#### 步骤 3：配置连接参数

在 Inspector 界面中填写：

| 字段 | 值 |
|------|-----|
| **Transport Type** | `STDIO` |
| **Command** | `node` |
| **Arguments** | `D:/AI/mcp/pcm/dist/index.js` |

> **⚠️ 重要**：Arguments 中必须使用**正斜杠** `/`，不能用反斜杠 `\`。Windows 路径中的 `\` 会被转义导致路径错误。

#### 步骤 4：连接并测试

1. 点击 **Connect** 按钮
2. 左下角显示 **Connected**（绿色）表示连接成功
3. 点击 **List Tools** 查看工具列表
4. 选择任意工具（如 `get_cpu_usage_chart`）
5. 点击 **Run Tool** 执行
6. 查看返回的 Markdown + Mermaid 图表

#### 常见问题

**Q: 连接时报错 `ENOENT` 或 `Command not found`**
- 检查 Arguments 路径是否正确（使用正斜杠）
- 确认 `dist/index.js` 文件存在

**Q: 工具执行报错 `template not found`**
- 确认 `dist/templates/` 目录下有 `.njk` 模板文件
- 重新执行 `pnpm build` 确保模板已复制

**Q: 修改代码后不生效**
- 需要重新 `pnpm build`
- 关闭 Inspector（`Ctrl+C`），重新执行 `npx fastmcp inspect dist/index.js`

### 直接运行服务

```bash
node dist/index.js
```

服务启动后会等待客户端连接，通过 StdIO 通信。

### 开发模式（热重载）

```bash
npm run dev
```

文件修改后自动重新构建，适合开发调试。

## 开发指南

参见 [AGENTS.md](./AGENTS.md) 了解详细的开发规范。

## License

MIT
