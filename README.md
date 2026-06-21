# MCP Services

多语言 MCP (Model Context Protocol) 服务仓库。

## 服务列表

| 服务 | 语言 | 状态 | 文档 |
|------|------|------|------|
| PCM (Personal Computer Manager) | TypeScript + Vite | 开发中 | [README](./pcm/) |
| Scaffold | Java 21 + Spring Boot | 开发中 | [README](./scaffold/) |

## 项目结构

```
mcp/
├── README.md          # 本文件
├── AGENTS.md          # Agent 开发规范
├── pcm/               # 个人电脑管家 MCP 服务 (TypeScript)
│   ├── README.md
│   ├── AGENTS.md
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ── src/
├── scaffold/          # Gradle 脚手架 MCP 服务 (Java)
│   ├── README.md
│   ├── AGENTS.md
│   ├── build.gradle
│   ├── settings.gradle
│   └── src/
── docs/              # 共享文档
└── scripts/           # 统一脚本
```

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详细的贡献指南。

## License

MIT
