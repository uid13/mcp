package com.uid13.scaffold.resource;

import org.springaicommunity.mcp.annotation.McpResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Gradle 模板资源提供者
 * 提供 Gradle 项目脚手架模板资源
 *
 * @author uid13
 */
@Component
public class GradleTemplateResourceProvider {

    /**
     * 默认 Gradle 版本
     */
    private static final String DEFAULT_GRADLE_VERSION = "8.14.5";

    /**
     * 获取 Gradle Wrapper 配置模板
     *
     * @param version Gradle 版本号，如 8.14.5、9.2.1，为 null 时使用默认版本 8.14.5
     * @return 模板内容
     */
    @McpResource(
        uri = "template://gradle/wrapper/gradle-wrapper.properties/{version}",
        name = "Gradle Wrapper Properties",
        description = "阿里云镜像 Gradle Wrapper 配置模板，version 为 Gradle 版本号（如 8.14.5、9.2.1），未指定时默认使用 8.14.5"
    )
    public String wrapperProperties(String version) {
        return renderWrapperProperties(version);
    }

    /**
     * 获取 Gradle Settings 配置模板
     * 包含阿里云 Maven 仓库配置（pluginManagement + dependencyResolutionManagement）
     *
     * @param projectName 项目名称
     * @return 渲染后的 settings.gradle 内容
     */
    @McpResource(
        uri = "template://gradle/settings.gradle/{projectName}",
        name = "Gradle Settings",
        description = "阿里云仓库配置的 settings.gradle 模板"
    )
    public String settingsGradle(String projectName) {
        String content = readTemplate("gradle/settings.gradle");
        return content.replace("{projectName}", projectName);
    }

    /**
     * 渲染 Wrapper 配置模板
     *
     * @param version Gradle 版本号，为 null 时使用默认版本 8.14.5
     * @return 渲染后的配置内容
     */
    private String renderWrapperProperties(String version) {
        String resolvedVersion = (version == null || version.isBlank()) ? DEFAULT_GRADLE_VERSION : version;
        String content = readTemplate("gradle/gradle-wrapper.properties");
        return content.replace("{version}", resolvedVersion);
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
