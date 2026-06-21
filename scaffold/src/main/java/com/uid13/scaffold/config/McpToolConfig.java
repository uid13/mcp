package com.uid13.scaffold.config;

import com.uid13.scaffold.resource.TemplateResourceProvider;
import com.uid13.scaffold.tool.HelloTool;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MCP 工具配置类
 * 注册 MCP 工具到 ToolCallbackProvider
 *
 * @author uid13
 */
@Configuration
public class McpToolConfig {

    /**
     * 注册 Hello 工具
     *
     * @param helloTool Hello 工具实例
     * @return ToolCallbackProvider
     */
    @Bean
    public ToolCallbackProvider helloTools(HelloTool helloTool) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(helloTool)
                .build();
    }

    /**
     * 注册模板资源工具
     *
     * @param templateResourceProvider 模板资源提供者
     * @return ToolCallbackProvider
     */
    @Bean
    public ToolCallbackProvider templateTools(TemplateResourceProvider templateResourceProvider) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(templateResourceProvider)
                .build();
    }
}
