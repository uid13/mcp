/**
 * PCM 仪表盘工具
 * 使用 Nunjucks 模板引擎生成 Mermaid 图表可视化（带 emoji 图标）
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import si from "systeminformation";
import nunjucks from "nunjucks";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置 Nunjucks 模板目录
nunjucks.configure(path.join(__dirname, "./templates"), { autoescape: false });

export function registerSiTools(server: FastMCP): void {

  server.addTool({
    name: "get_system_dashboard",
    description: "获取系统信息仪表盘，包含内存、磁盘使用率的 Mermaid 饼图，以及软件版本信息",
    parameters: z.object({}),
    execute: async () => {
      const [cpu, mem, disks, osInfo, versions] = await Promise.all([
        si.cpu(), si.mem(), si.fsSize(), si.osInfo(), si.versions("node,npm,git"),
      ]);

      const totalGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
      const usedGB = (mem.used / 1024 / 1024 / 1024).toFixed(1);
      const availGB = (mem.available / 1024 / 1024 / 1024).toFixed(1);
      const usedPercent = Math.round((mem.used / mem.total) * 100);

      const diskData = disks.slice(0, 6).map((d) => ({
        mount: d.mount,
        use: d.use.toFixed(0),
        usePercent: d.use.toFixed(0) + "%",
        icon: d.use > 90 ? "\u{1F534}" : d.use > 70 ? "\u{1F7E1}" : "\u{1F7E2}",
      }));

      return nunjucks.render("system-dashboard.njk", {
        totalGB, usedGB, availGB, usedPercent,
        availPercent: 100 - usedPercent,
        disks: diskData,
        cpu, osInfo, versions,
      });
    },
  });

  server.addTool({
    name: "get_cpu_usage_chart",
    description: "获取 CPU 各核心使用率的 Mermaid 图表",
    parameters: z.object({}),
    execute: async () => {
      const [cpu, load, cpuTemp] = await Promise.all([si.cpu(), si.currentLoad(), si.cpuTemperature()]);

      const cores = load.cpus.slice(0, 16).map((core, index) => ({
        index: index + 1,
        usage: Math.round(core.load),
        icon: core.load > 90 ? "\u{1F534}" : core.load > 70 ? "\u{1F7E1}" : "\u{1F7E2}",
      }));

      return nunjucks.render("cpu-usage.njk", {
        avgLoad: Math.round(load.currentLoad),
        cores, cpu, cpuTemp,
      });
    },
  });

  server.addTool({
    name: "get_memory_chart",
    description: "获取内存使用详细信息的 Mermaid 图表",
    parameters: z.object({}),
    execute: async () => {
      const [mem, memLayout] = await Promise.all([si.mem(), si.memLayout()]);

      const totalGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
      const usedGB = (mem.used / 1024 / 1024 / 1024).toFixed(1);
      const freeGB = (mem.free / 1024 / 1024 / 1024).toFixed(1);
      const usedPercent = Math.round((mem.used / mem.total) * 100);

      const slots = memLayout.map((s, i) => ({
        index: i + 1,
        size: (s.size / 1024 / 1024 / 1024).toFixed(1),
        type: s.type,
        clockSpeed: s.clockSpeed,
        manufacturer: s.manufacturer,
      }));

      return nunjucks.render("memory-chart.njk", {
        totalGB, usedGB, freeGB,
        usedPercent, freePercent: 100 - usedPercent,
        swapTotal: (mem.swaptotal / 1024 / 1024 / 1024).toFixed(1),
        swapUsed: (mem.swapused / 1024 / 1024 / 1024).toFixed(1),
        swapFree: (mem.swapfree / 1024 / 1024 / 1024).toFixed(1),
        slots,
      });
    },
  });

  server.addTool({
    name: "get_disk_chart",
    description: "获取磁盘使用详细信息的 Mermaid 图表",
    parameters: z.object({}),
    execute: async () => {
      const disks = await si.fsSize();

      const diskData = disks.map((d) => ({
        mount: d.mount,
        type: d.type,
        sizeGB: (d.size / 1024 / 1024 / 1024).toFixed(1),
        usedGB: (d.used / 1024 / 1024 / 1024).toFixed(1),
        availGB: (d.available / 1024 / 1024 / 1024).toFixed(1),
        use: Math.round(d.use),
        usePercent: d.use.toFixed(1),
        icon: d.use > 90 ? "\u{1F534}" : d.use > 70 ? "\u{1F7E1}" : "\u{1F7E2}",
      }));

      return nunjucks.render("disk-chart.njk", { disks: diskData });
    },
  });

  server.addTool({
    name: "get_network_chart",
    description: "获取网络接口信息的 Mermaid 图表",
    parameters: z.object({}),
    execute: async () => {
      const interfaces = await si.networkInterfaces();

      const ifaceData = interfaces.map((i) => ({
        iface: i.iface,
        ip4: i.ip4,
        mac: i.mac,
        speedText: i.speed > 0 ? i.speed + " Mbps" : "N/A",
        operstate: i.operstate,
      }));

      return nunjucks.render("network-chart.njk", {
        interfaces: ifaceData,
        internalCount: interfaces.filter((i) => i.internal).length,
        externalCount: interfaces.filter((i) => !i.internal).length,
      });
    },
  });
}
