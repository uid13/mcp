# Scaffold MCP Server - Agent 开发指南

## 项目概述

Scaffold 是一个基于 Spring Boot + Spring AI Alibaba 的 MCP Server 实现，提供 Streamable-HTTP 传输协议支持。

## 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 21 | LTS 版本 |
| Spring Boot | 3.5.8 | Web 框架 |
| Spring AI | 1.1.2 | AI 集成框架 |
| Spring AI Alibaba | 1.1.2.2 | 阿里云 AI 组件 |
| Gradle | 8.14.5 | 构建工具 |

## 项目结构

```
scaffold/
├── build.gradle                    # Gradle 构建配置
├── settings.gradle                 # Gradle 设置
├── src/
│   ├── main/
│   │   ├── java/com/uid13/scaffold/
│   │   │   ├── ScaffoldApplication.java            # Spring Boot 主入口
│   │   │   ├── config/
│   │   │   │   └── McpToolConfig.java              # MCP 工具注册配置
│   │   │   ├── resource/
│   │   │   │   ── GradleTemplateResourceProvider.java  # Gradle 模板资源
│   │   │   └── tool/
│   │   │       └── HelloTool.java                  # MCP 工具实现
│   │   └── resources/
│   │       ├── application.yml                     # 应用配置
│   │       └── templates/
│   │           └── gradle/
│   │               ├── gradle-wrapper.properties.template
│   │               └── settings.gradle.template
│   └── test/
│       └── java/com/uid13/scaffold/
│           └── ScaffoldApplicationTests.java       # 测试类
├── README.md
└── AGENTS.md
```

## 开发规范

### 1. 代码规范

- 使用 Java 21 语法特性
- 遵循 Spring Boot 最佳实践
- 所有类添加 Javadoc 注释
- 使用 `@Tool` 注解定义 MCP 工具
- 使用 `@McpResource` 注解定义 MCP 资源

### 2. 添加 MCP 工具

#### 步骤 1: 创建工具类

在 `com.uid13.scaffold.tool` 包下创建新类：

```java
package com.uid13.scaffold.tool;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class MyNewTool {

    @Tool(description = "工具功能描述")
    public String myMethod(String param) {
        // 实现逻辑
        return "结果";
    }
}
```

#### 步骤 2: 注册工具

在 `McpToolConfig.java` 中注册：

```java
@Bean
public ToolCallbackProvider myNewTools(MyNewTool myNewTool) {
    return MethodToolCallbackProvider.builder()
            .toolObjects(myNewTool)
            .build();
}
```

### 3. 添加 MCP 资源

#### 步骤 1: 创建资源类

在 `com.uid13.scaffold.resource` 包下创建新类：

```java
package com.uid13.scaffold.resource;

import org.springaicommunity.mcp.annotation.McpResource;
import org.springframework.stereotype.Component;

@Component
public class MyResourceProvider {

    @McpResource(
        uri = "template://my-category/my-resource/{param}",
        name = "My Resource",
        description = "资源描述"
    )
    public String myResource(String param) {
        // 实现逻辑
        return "内容";
    }
}
```

#### 步骤 2: 添加模板文件

将模板文件放在 `src/main/resources/templates/` 目录下，使用 `{param}` 作为占位符，在 Java 代码中通过 `String.replace()` 替换。

### 4. 配置说明

主要配置项位于 `application.yml`:

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `spring.ai.mcp.server.name` | MCP Server 名称 | scaffold-mcp-server |
| `spring.ai.mcp.server.version` | 版本号 | 1.0.0 |
| `spring.ai.mcp.server.protocol` | 传输协议 | STREAMABLE |
| `server.port` | 服务端口 | 4080 |
| `spring.ai.mcp.server.streamable-http.mcp-endpoint` | MCP 端点路径 | /stream |

### 5. 构建与测试

```bash
# 构建项目
./gradlew build

# 运行测试
./gradlew test

# 启动应用
./gradlew bootRun

# 清理构建
./gradlew clean
```

### 6. 依赖管理

项目使用 BOM 管理依赖版本：

- `spring-ai-bom:1.1.2`
- `spring-ai-alibaba-bom:1.1.2.2`

添加新依赖时，优先使用 BOM 中已定义的版本。

### 7. Maven 仓库配置

项目使用阿里云 Maven 镜像加速依赖下载：

- `https://maven.aliyun.com/repository/public/` - 公共仓库
- `https://maven.aliyun.com/repository/spring/` - Spring 仓库

## MCP 协议说明

### Streamable-HTTP 传输

本项目使用 Streamable-HTTP 协议，端点为：

```
POST /stream
```

### 工具定义规范

- 使用 `@Tool` 注解定义工具方法
- `description` 属性必须清晰描述工具功能
- 方法参数应使用简单类型或可序列化的对象

### 资源定义规范

- 使用 `@McpResource` 注解定义资源，import 来自 `org.springaicommunity.mcp.annotation.McpResource`
- 资源 URI 使用模板语法，如 `template://gradle/wrapper/gradle-wrapper.properties/{version}`
- 可选参数通过 description 引导 AI agent 传入默认值，服务端代码做判空兜底
- 模板文件放在 `src/main/resources/templates/` 下，使用 `{param}` 占位符，Java 代码中通过 `String.replace()` 替换

## 常见问题

### Q: 如何调试 MCP 工具？

A: 在工具方法中添加日志，使用 `@Slf4j` 或 `LoggerFactory` 记录执行过程。

### Q: 如何支持 SSE 协议？

A: 修改 `application.yml` 中的 `spring.ai.mcp.server.protocol` 为 `SSE`。

### Q: 为什么 `@McpResource` 的 import 是 `org.springaicommunity` 而不是 `org.springframework.ai`？

A: Spring AI 1.x 中 `@McpResource` 注解位于 `org.springaicommunity:mcp-annotations` 依赖中。新包路径 `org.springframework.ai.mcp.annotation.*` 仅在 Spring AI 2.0.0+ 中可用。当前项目在 `build.gradle` 中显式依赖 `org.springframework.ai:spring-ai-mcp-annotations:1.1.8`（通过 BOM 管理版本），其传递引入 `org.springaicommunity:mcp-annotations:0.9.0`。

### Q: 如何添加认证？

A: 参考 Spring Security 配置，在 MCP 端点添加认证拦截器。

## 参考文档

- [Spring AI 官方文档](https://docs.spring.io/spring-ai/reference/)
- [Spring AI MCP Annotations](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-annotations-server.html)
- [Spring AI Alibaba 文档](https://java2ai.com/)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [MCP Resource Templates](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)
