/**
 * 系统信息工具
 * 基于 systeminformation，提供系统监控、CPU、内存、磁盘、软件版本、网络等工具
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import { systemDashboardHandler, cpuChartHandler } from "./system.js";
import { memoryChartHandler, diskChartHandler } from "./storage.js";
import { softwareVersionsHandler } from "./software.js";
import { networkChartHandler } from "./network.js";

export function registerSiTools(server: FastMCP): void {
  server.addTool({
    name: "get_system_dashboard",
    description: "获取系统信息仪表盘。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: systemDashboardHandler,
  });

  server.addTool({
    name: "get_cpu_usage_chart",
    description: "获取 CPU 各核心使用率。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: cpuChartHandler,
  });

  server.addTool({
    name: "get_memory_chart",
    description: "获取内存使用详细信息。️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: memoryChartHandler,
  });

  server.addTool({
    name: "get_disk_chart",
    description: "获取磁盘使用详细信息。️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: diskChartHandler,
  });

  server.addTool({
    name: "get_software_versions",
    description: "获取已安装软件版本信息。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji，不要省略",
    parameters: z.object({}),
    execute: softwareVersionsHandler,
  });

  server.addTool({
    name: "get_network_chart",
    description: "获取网络接口信息。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: networkChartHandler,
  });
}
