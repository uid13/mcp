# MCP Services - Agent 开发规范

## 项目概述

本仓库包含多个 MCP (Model Context Protocol) 服务，每个服务可能使用不同的编程语言实现。

## 开发规范

### 通用要求

1. **语言无关**：每个服务目录是独立的项目，使用各自语言的包管理器和构建工具
2. **文档完整**：每个服务必须有独立的 README.md 和 AGENTS.md
3. **测试覆盖**：关键功能必须有测试用例
4. **类型安全**：优先使用强类型语言特性（TypeScript、Java、Go 等）

### 目录结构

```
mcp/
├── <service-name>/      # 服务目录
│   ├── README.md        # 服务说明
│   ├── AGENTS.md        # Agent 开发指南
│   ├── package.json     # 或 pom.xml, go.mod, pyproject.toml
│   └── src/             # 源代码
├── docs/                # 共享文档
└── scripts/             # 统一脚本
```

### 服务开发流程

1. 在根目录下创建服务目录（如 `pcm/`）
2. 初始化项目（`npm init`, `mvn archetype`, `go mod init` 等）
3. 实现 MCP 协议接口
4. 编写测试
5. 更新文档

### MCP 协议要求

- 支持 StdIO 传输（本地进程通信）
- 支持 Streamable HTTP 传输（远程服务）
- 工具定义必须包含清晰的描述和参数 Schema
- 遵循 MCP 规范版本 2024-11-05 或更新

### 发布规范

- TypeScript 服务发布到 npm
- Java 服务发布到 Maven Central
- Python 服务发布到 PyPI
- Go 服务通过 Git Tag 发布

## 技术栈

| 服务 | 语言 | 框架 | 构建工具 |
|------|------|------|---------|
| PCM | TypeScript | Vite | pnpm |

## 测试

每个服务使用各自语言的测试框架：
- TypeScript: Vitest / Jest
- Java: JUnit 5
- Python: pytest
- Go: testing 包

## CI/CD

使用 GitHub Actions，按路径触发：
- `pcm/**` → 运行 TS CI
- `java/**` → 运行 Java CI
- `python/**` → 运行 Python CI
- `go/**` → 运行 Go CI
