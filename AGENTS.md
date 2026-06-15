# PCM - Agent 开发指南

## 项目结构

```
pcm/
├── README.md           # 项目说明
├── AGENTS.md           # 本文件
── package.json        # 依赖配置
├── tsconfig.json       # TypeScript 配置
├── vite.config.ts      # Vite 配置
── src/
    ├── index.ts        # MCP 服务入口
    ├── tools/          # MCP 工具实现
    │   ├── system.ts   # 系统信息工具
    │   ├── files.ts    # 文件管理工具
    │   ├── process.ts  # 进程管理工具
    │   └── network.ts  # 网络工具
    ├── utils/          # 工具函数
    └── types/          # 类型定义
```

## 开发环境

### 要求

- Node.js >= 18
- npm >= 9
- TypeScript >= 5.0

### 依赖版本

```json
{
  "vite": "^8.0.0",
  "typescript": "^5.0.0",
  "@modelcontextprotocol/sdk": "^0.5.0"
}
```

## 开发规范

### 代码风格

1. **使用 TypeScript 严格模式**
   - 启用 `strict: true`
   - 所有函数必须有返回类型注解
   - 所有参数必须有类型注解

2. **命名规范**
   - 工具名称：`snake_case`（如 `get_system_info`）
   - 函数名称：`camelCase`（如 `getSystemInfo`）
   - 类名称：`PascalCase`（如 `SystemTool`）
   - 常量：`UPPER_SNAKE_CASE`（如 `MAX_FILE_SIZE`）

3. **文件组织**
   - 每个工具一个文件
   - 工具文件放在 `src/tools/` 目录
   - 工具函数放在 `src/utils/` 目录

### MCP 工具开发

#### 工具定义模板

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerSystemTools(server: McpServer) {
  server.tool(
    'get_system_info',
    '获取系统基本信息',
    {}, // 无参数
    async () => {
      // 实现逻辑
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(systemInfo, null, 2),
          },
        ],
      };
    }
  );
}
```

#### 工具参数 Schema

使用 Zod 定义参数验证：

```typescript
import { z } from 'zod';

const ListFilesParams = z.object({
  path: z.string().describe('目录路径'),
  recursive: z.boolean().optional().describe('是否递归列出'),
});
```

#### 工具返回格式

```typescript
return {
  content: [
    {
      type: 'text',
      text: '工具执行结果',
    },
  ],
  // 可选：结构化内容
  structuredContent: {
    key: 'value',
  },
};
```

### 错误处理

1. **工具执行错误**：返回错误信息，不要抛出异常
2. **参数验证错误**：使用 Zod 验证，返回清晰的错误提示
3. **系统错误**：记录日志，返回用户友好的错误信息

```typescript
try {
  // 执行操作
} catch (error) {
  return {
    content: [
      {
        type: 'text',
        text: `执行失败：${error.message}`,
      },
    ],
    isError: true,
  };
}
```

### 测试

使用 Vitest 编写测试：

```typescript
import { describe, it, expect } from 'vitest';
import { getSystemInfo } from '../tools/system';

describe('System Tools', () => {
  it('should return system info', async () => {
    const result = await getSystemInfo();
    expect(result).toHaveProperty('platform');
    expect(result).toHaveProperty('arch');
  });
});
```

运行测试：

```bash
npm run test
```

### 构建和发布

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 发布到 npm
npm publish
```

## 调试

### 使用 MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### 日志输出

使用 `console.error` 输出调试信息（不会干扰 MCP 协议）：

```typescript
console.error('[PCM] 调试信息:', data);
```

## 常见问题

### Q: 工具没有被 AI 识别？

A: 确保工具名称和描述清晰，参数 Schema 正确。

### Q: 如何添加新工具？

A: 在 `src/tools/` 创建新文件，在 `src/index.ts` 中注册。

### Q: 如何处理大文件操作？

A: 使用流式处理，避免一次性加载大文件到内存。

## 参考资源

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Vite 文档](https://vitejs.dev/)
