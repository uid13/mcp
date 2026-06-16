# PCM - Personal Computer Manager

个人电脑管家 MCP 服务，提供系统监控和图片处理能力。

## 功能特性

### 系统监控

- 🖥️ **系统仪表盘** - 系统信息总览（内存、磁盘、CPU、软件版本）
- 🧠 **CPU 监控** - CPU 各核心使用率分析
- 💾 **内存监控** - 内存使用详情（含 swap 和插槽信息）
- 💽 **磁盘监控** - 磁盘使用率详情
- 📦 **软件版本** - 已安装开发软件版本检测
- 🌐 **网络监控** - 网络接口信息

### 图片处理

基于策略模式 + 操作链模式，支持 13 种图片操作：

- **几何变换**: resize（调整尺寸）、rotate（旋转）、extract（裁剪）、flip（垂直翻转）、flop（水平翻转）、trim（裁边缘）
- **色彩效果**: blur（模糊）、sharpen（锐化）、greyscale（灰度化）、negate（反色）、normalize（对比度增强）
- **合成叠加**: composite（水印/叠加）
- **格式转换**: convert（格式转换，支持 jpeg/png/webp/avif）

## 技术栈

- **语言**: TypeScript
- **构建工具**: Vite ^8.0.16
- **MCP 框架**: FastMCP ^4.3.0
- **图片处理**: Sharp ^0.34.5
- **系统信息**: systeminformation ^5.31.7
- **参数验证**: Zod ^3.22.0
- **Schema 生成**: zod-to-json-schema ^3.24.0

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 运行 MCP 服务

```bash
pnpm start
```

## 工具列表

### 系统监控工具

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `get_system_dashboard` | 获取系统信息仪表盘 | 无 |
| `get_cpu_usage_chart` | 获取 CPU 各核心使用率 | 无 |
| `get_memory_chart` | 获取内存使用详情 | 无 |
| `get_disk_chart` | 获取磁盘使用详情 | 无 |
| `get_software_versions` | 获取已安装软件版本 | 无 |
| `get_network_chart` | 获取网络接口信息 | 无 |

### 图片处理工具

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `image_capabilities` | 获取所有可用操作及参数定义 | 无 |
| `image_info` | 获取图片元数据 | `inputPath`: 图片路径 |
| `image_process` | 执行图片操作链 | `inputPath`, `operations`, `outputPath?` |

#### 操作链示例

```json
{
  "inputPath": "/path/to/image.png",
  "operations": [
    { "type": "resize", "width": 800 },
    { "type": "rotate", "angle": 90 },
    { "type": "sharpen" },
    { "type": "convert", "format": "webp", "quality": 85 }
  ],
  "outputPath": "/path/to/output.webp"
}
```

## 项目结构

```
pcm/
├── src/
│   ├── index.ts                    # 服务入口
│   └── tools/
│       ├── si/
│       │   └── index.ts            # 系统信息工具
│       └── image/
│           ├── types.ts            # 操作类型定义
│           ├── registry.ts         # 操作注册表
│           ├── index.ts            # 图片处理工具
│           └── operations/         # 操作实现
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
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 使用示例

### 直接运行

```bash
# npx 直接运行（无需全局安装）
npx @uid13/pcm

# 全局安装后运行
npm install -g @uid13/pcm
pcm
```

### 在 Codex 中使用

编辑 `~/.codex/config.toml`：

```toml
[mcp_servers.pcm]
type = "stdio"
command = "npx"
args = ["@uid13/pcm"]
```

### 在 OpenCode 中使用

编辑 `~/.config/opencode/opencode.json`，在 `mcp` 对象中添加：

```json
{
  "mcp": {
    "Pcm": {
      "enabled": true,
      "type": "local",
      "command": ["npx", "@uid13/pcm"]
    }
  }
}
```

## 调试与测试

### 使用 MCP Inspector 调试

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) 是官方提供的可视化调试工具。

#### 步骤 1：构建项目

```bash
pnpm build
```

#### 步骤 2：启动 Inspector

```bash
npx fastmcp inspect dist/index.js
```

#### 步骤 3：配置连接参数

| 字段 | 值 |
|------|-----|
| **Transport Type** | `STDIO` |
| **Command** | `node` |
| **Arguments** | `D:/AI/mcp/pcm/dist/index.js` |

> **⚠️ 重要**：Arguments 中必须使用**正斜杠** `/`，不能用反斜杠 `\`。

#### 步骤 4：连接并测试

1. 点击 **Connect** 按钮
2. 左下角显示 **Connected**（绿色）表示连接成功
3. 点击 **List Tools** 查看工具列表
4. 选择任意工具执行

#### 常见问题

**Q: 连接时报错 `ENOENT` 或 `Command not found`**
- 检查 Arguments 路径是否正确（使用正斜杠）
- 确认 `dist/index.js` 文件存在

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
pnpm dev
```

文件修改后自动重新构建，适合开发调试。

## 开发指南

参见 [AGENTS.md](./AGENTS.md) 了解详细的开发规范。

## License

MIT
