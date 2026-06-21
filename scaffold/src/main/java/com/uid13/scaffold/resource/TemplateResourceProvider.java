package com.uid13.scaffold.resource;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * MCP 模板资源提供者
 * 提供 Gradle 项目脚手架模板，支持通过 Thymeleaf 渲染变量
 *
 * @author uid13
 */
@Component
public class TemplateResourceProvider {

    private final SpringTemplateEngine textTemplateEngine;

    public TemplateResourceProvider(SpringTemplateEngine textTemplateEngine) {
        this.textTemplateEngine = textTemplateEngine;
    }

    /**
     * 获取 Gradle Wrapper 配置模板
     * 使用阿里云镜像，Gradle 8.14.5
     *
     * @return 模板内容
     */
    @Tool(description = "获取 Gradle Wrapper 配置模板，包含阿里云镜像和 Gradle 8.14.5 版本配置")
    public String getGradleWrapperProperties() {
        return readTemplate("gradle/gradle-wrapper.properties");
    }

    /**
     * 获取 Gradle Settings 配置模板
     * 包含阿里云 Maven 仓库配置（pluginManagement + dependencyResolutionManagement）
     *
     * @param projectName 项目名称，用于替换模板中的 {{PROJECT_NAME}} 占位符
     * @return 渲染后的 settings.gradle 内容
     */
    @Tool(description = "获取 Gradle Settings 配置模板，包含阿里云仓库配置，需要传入项目名称")
    public String getGradleSettings(String projectName) {
        Context context = new Context();
        context.setVariable("projectName", projectName);
        return textTemplateEngine.process("gradle/settings.gradle", context);
    }

    /**
     * 从 classpath 读取模板文件内容
     *
     * @param templatePath 模板路径（相对于 templates/ 目录，不含 .template 后缀）
     * @return 模板文件内容
     */
    private String readTemplate(String templatePath) {
        try (InputStream is = getClass().getClassLoader()
                .getResourceAsStream("templates/" + templatePath + ".template")) {
            if (is == null) {
                return "Error: template not found - " + templatePath;
            }
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "Error reading template: " + e.getMessage();
        }
    }
}
