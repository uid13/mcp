# Scaffold MCP Server

基于 Spring Boot + Spring AI Alibaba 的 MCP (Model Context Protocol) Server 实现。

## 技术栈

| 组件 | 版本 |
|------|------|
| Java | 21 |
| Spring Boot | 3.5.8 |
| Spring AI | 1.1.2 |
| Spring AI Alibaba | 1.1.2.2 |
| Gradle | 8.14.5 |

## 功能特性

- **MCP Server**: 支持 Streamable-HTTP 传输协议
- **Hello 工具**: 提供简单的 `hello` 方法，返回 "Hello World"

## 快速开始

### 环境要求

- JDK 21+
- Gradle 8.14.5 (已内置 Wrapper)

### 构建项目

```bash
./gradlew build
```

### 运行应用

```bash
./gradlew bootRun
```

应用启动后，MCP Server 将在 `http://localhost:4080` 上运行。

### MCP 端点

- **Streamable-HTTP**: `POST /stream`

## 项目结构

```
scaffold/
├── build.gradle                    # Gradle 构建配置
├── settings.gradle                 # Gradle 设置
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties
├── src/
│   ├── main/
│   │   ├── java/com/uid13/scaffold/
│   │   │   ├── ScaffoldApplication.java        # 主入口
│   │   │   ├── config/
│   │   │   │   └── McpToolConfig.java          # MCP 工具注册
│   │   │   └── tool/
│   │   │       └── HelloTool.java              # Hello 工具
│   │   └── resources/
│   │       └── application.yml                 # 应用配置
│   └── test/
│       └── java/com/uid13/scaffold/
│           └── ScaffoldApplicationTests.java   # 测试
├── README.md
└── AGENTS.md
```

## 添加新工具

1. 在 `com.uid13.scaffold.tool` 包下创建新的工具类
2. 使用 `@Component` 和 `@Tool` 注解定义工具方法
3. 在 `McpToolConfig` 中注册工具

示例：

```java
@Component
public class MyTool {
    
    @Tool(description = "工具描述")
    public String myMethod(String param) {
        return "结果";
    }
}
```

## 配置说明

主要配置项 (`application.yml`):

```yaml
spring:
  ai:
    mcp:
      server:
        name: scaffold-mcp-server    # MCP Server 名称
        version: 1.0.0               # 版本号
        protocol: STREAMABLE         # 传输协议
```

## 许可证

Apache License 2.0
