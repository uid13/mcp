#!/usr/bin/env node
/**
 * PCM - Personal Computer Manager MCP Service
 * 个人电脑管家 MCP 服务入口
 */

import { FastMCP } from "fastmcp";
import { registerSiTools } from "./tools/si/index.js";
import { registerImageTools } from "./tools/image/index.js";
import { registerCcTools } from "./tools/cc/index.js";
import { registerIconifyTools } from "./tools/iconify/index.js";

/**
 * 创建并配置 MCP 服务器
 */
function createServer(): FastMCP {
  const server = new FastMCP({
    name: "pcm",
    version: "0.1.0",
  });

  registerSiTools(server);
  registerImageTools(server);
  registerCcTools(server);
  registerIconifyTools(server);

  return server;
}

/**
 * 启动服务器
 */
async function main(): Promise<void> {
  const server = createServer();

  await server.start({
    transportType: "stdio",
  });

  console.error("[PCM] MCP 服务已启动");
  console.error("[PCM] 等待客户端连接...");
}

main().catch((error) => {
  console.error("[PCM] 启动失败:", error);
  process.exit(1);
});
