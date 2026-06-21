package com.uid13.scaffold.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

/**
 * MCP Resource 配置类
 * 配置 Thymeleaf TEXT 模式模板引擎，用于渲染纯文本模板
 *
 * @author uid13
 */
@Configuration
public class McpResourceConfig {

    /**
     * 创建 TEXT 模式的 Thymeleaf 模板引擎
     * 用于渲染非 HTML 的纯文本模板（如 .gradle、.properties 等）
     *
     * @return SpringTemplateEngine
     */
    @Bean
    public SpringTemplateEngine textTemplateEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".template");
        resolver.setTemplateMode(TemplateMode.TEXT);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.addTemplateResolver(resolver);
        return engine;
    }
}
