# 贡献指南

感谢你对 MCP Services 项目的关注！我们欢迎各种形式的贡献，包括代码提交、问题报告、文档改进等。

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议，请在 GitHub 上创建 Issue：

1. 先搜索现有的 Issue，避免重复
2. 使用清晰的标题描述问题
3. 提供详细的复现步骤（如果是 bug）
4. 说明你的环境信息（操作系统、Node.js 版本等）

### 提交代码

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 进行开发和测试
4. 提交代码：`git commit -m "Add your feature"`
5. 推送分支：`git push origin feature/your-feature-name`
6. 创建 Pull Request

### 开发规范

#### 代码风格

- 使用 TypeScript 严格模式
- 遵循各服务目录下的 `AGENTS.md` 开发规范
- 保持代码格式化一致（使用 Prettier/ESLint）

#### 测试要求

- 新功能必须包含相应的测试用例
- 确保所有测试通过后再提交
- 测试命令因服务而异，参考各服务的 `package.json`

#### 提交信息

使用清晰的提交信息格式：

- `feat: 添加新功能`
- `fix: 修复 bug`
- `docs: 更新文档`
- `style: 代码格式调整`
- `refactor: 代码重构`
- `test: 添加测试`
- `chore: 构建/工具变更`

### 添加新服务

如果你想添加新的 MCP 服务：

1. 在根目录创建服务目录（如 `new-service/`）
2. 初始化项目（使用对应语言的包管理器）
3. 实现 MCP 协议接口
4. 编写完整的文档：
   - `README.md` - 服务说明和使用方法
   - `AGENTS.md` - 开发规范
5. 更新根目录 `README.md` 的服务列表
6. 添加相应的测试

## 开发流程

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/uid13/mcp.git
cd mcp

# 进入具体服务目录
cd pcm  # 或其他服务

# 安装依赖
pnpm install  # 或 npm install / yarn install

# 开发模式
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test
```

### 代码审查

所有提交都需要经过代码审查：

- 至少需要 1 个审查者批准
- 确保 CI 测试通过
- 解决所有审查意见

## 行为准则

- 保持友好和专业的沟通
- 尊重不同的观点和经验
- 接受建设性的批评
- 关注对社区最有利的事情

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

## 需要帮助？

如有任何问题，请：

- 创建 GitHub Issue
- 查看现有文档
- 参考各服务的 README 和 AGENTS.md
