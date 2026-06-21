package com.uid13.scaffold.tool;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

/**
 * MCP Hello 工具
 * 提供一个简单的 hello 方法，返回 Hello World
 *
 * @author uid13
 */
@Component
public class HelloTool {

    /**
     * 返回 Hello World 消息
     *
     * @return Hello World 字符串
     */
    @Tool(description = "Say hello world")
    public String hello() {
        return "Hello World";
    }
}
