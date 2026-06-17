/**
 * PCM 仪表盘工具
 * 返回结构化 JSON 数据 + 渲染元数据，指导模型如何展示
 */

import { FastMCP } from "fastmcp";
import { z } from "zod";
import si from "systeminformation";

/** 生成 emoji 进度条，每个方块代表 10% */
function emojiBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  let icon: string;
  if (percent > 90) icon = "🔴";
  else if (percent > 70) icon = "🟧";
  else if (percent > 50) icon = "🟡";
  else icon = "🟩";
  return icon.repeat(filled) + "⬜".repeat(empty);
}

/** 根据使用率返回状态 emoji */
function statusEmoji(percent: number): string {
  if (percent > 90) return "🔴";
  if (percent > 70) return "🟡";
  return "🟢";
}

/** 统一渲染元数据 */
const renderGuide = {
  layout: "三级标题 renderGuide.progressbar",
  progressbar: "格式：` 🟩⬜ 15% `",
  statusIcon: "每项百分比指标后面必须附带状态 emoji：>90% 用 🔴，70-90% 用 🟡，<70% 用 🟢",
  table: "表格每行开头必须带对应的 emoji 图标，不要省略任何 emoji",
  output: "必须完整输出所有数据和 emoji，不要省略、不要改写进度条和表格内容。可以在最后附加简短分析",
};

export function registerSiTools(server: FastMCP): void {

  server.addTool({
    name: "get_system_dashboard",
    description: "获取系统信息仪表盘。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: async () => {
      const [cpu, mem, disks, osInfo] = await Promise.all([
        si.cpu(), si.mem(), si.fsSize(), si.osInfo(),
      ]);

      const totalGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
      const usedGB = (mem.used / 1024 / 1024 / 1024).toFixed(1);
      const availGB = (mem.available / 1024 / 1024 / 1024).toFixed(1);
      const usedPercent = Math.round((mem.used / mem.total) * 100);

      return JSON.stringify({
        renderGuide,
        data: {
          title: "🖥️ 系统信息仪表盘",
          memory: {
            label: " 内存使用",
            totalGB, usedGB, availGB,
            usagePercent: usedPercent,
            bar: emojiBar(usedPercent),
            status: statusEmoji(usedPercent),
          },
          disks: disks.slice(0, 6).map((d) => ({
            mount: d.mount,
            usePercent: parseFloat(d.use.toFixed(1)),
            bar: emojiBar(d.use),
            status: statusEmoji(d.use),
          })),
          overview: [
            { icon: "💿", label: "操作系统", value: `${osInfo.distro} ${osInfo.release}` },
            { icon: "🏠", label: "主机名", value: osInfo.hostname },
            { icon: "💻", label: "CPU", value: `${cpu.brand} @ ${cpu.speed} GHz` },
            { icon: "🔢", label: "物理核心", value: String(cpu.physicalCores) },
            { icon: "💾", label: "内存总量", value: `${totalGB} GB` },
            { icon: "📊", label: "内存使用率", value: `${usedPercent}%` },
          ],
        },
      }, null, 2);
    },
  });

  server.addTool({
    name: "get_cpu_usage_chart",
    description: "获取 CPU 各核心使用率。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: async () => {
      const [cpu, load, cpuTemp] = await Promise.all([si.cpu(), si.currentLoad(), si.cpuTemperature()]);
      const avgLoad = Math.round(load.currentLoad);

      return JSON.stringify({
        renderGuide,
        data: {
          title: "🧠 CPU 使用率分析",
          avgLoad,
          avgBar: emojiBar(load.currentLoad),
          avgStatus: statusEmoji(load.currentLoad),
          info: [
            { icon: "🧩", label: "型号", value: cpu.brand },
            { icon: "🏢", label: "制造商", value: cpu.manufacturer },
            { icon: "🔢", label: "物理核心", value: String(cpu.physicalCores) },
            { icon: "💨", label: "逻辑核心", value: String(cpu.cores) },
            { icon: "⚡", label: "基础频率", value: `${cpu.speed} GHz` },
            { icon: "🚀", label: "最大频率", value: `${cpu.speedMax} GHz` },
            { icon: "🌡️", label: "温度", value: cpuTemp.main ? `${cpuTemp.main}°C` : "N/A" },
          ],
          cores: load.cpus.slice(0, 16).map((core, index) => ({
            index: index + 1,
            usage: Math.round(core.load),
            bar: emojiBar(core.load),
            status: statusEmoji(core.load),
          })),
        },
      }, null, 2);
    },
  });

  server.addTool({
    name: "get_memory_chart",
    description: "获取内存使用详细信息。️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: async () => {
      const [mem, memLayout] = await Promise.all([si.mem(), si.memLayout()]);
      const totalGB = (mem.total / 1024 / 1024 / 1024).toFixed(1);
      const usedGB = (mem.used / 1024 / 1024 / 1024).toFixed(1);
      const freeGB = (mem.free / 1024 / 1024 / 1024).toFixed(1);
      const usedPercent = Math.round((mem.used / mem.total) * 100);

      return JSON.stringify({
        renderGuide,
        data: {
          title: "💾 内存使用详情",
          memory: {
            totalGB, usedGB, freeGB,
            usagePercent: usedPercent,
            bar: emojiBar(usedPercent),
            status: statusEmoji(usedPercent),
          },
          swap: {
            total: (mem.swaptotal / 1024 / 1024 / 1024).toFixed(1),
            used: (mem.swapused / 1024 / 1024 / 1024).toFixed(1),
            free: (mem.swapfree / 1024 / 1024 / 1024).toFixed(1),
          },
          slots: memLayout.map((s, i) => ({
            index: i + 1,
            size: (s.size / 1024 / 1024 / 1024).toFixed(1),
            type: s.type,
            clockSpeed: s.clockSpeed,
            manufacturer: s.manufacturer,
          })),
        },
      }, null, 2);
    },
  });

  server.addTool({
    name: "get_disk_chart",
    description: "获取磁盘使用详细信息。️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: async () => {
      const disks = await si.fsSize();

      return JSON.stringify({
        renderGuide,
        data: {
          title: "💽 磁盘使用详情",
          disks: disks.map((d) => ({
            mount: d.mount,
            type: d.type,
            sizeGB: (d.size / 1024 / 1024 / 1024).toFixed(1),
            usedGB: (d.used / 1024 / 1024 / 1024).toFixed(1),
            availGB: (d.available / 1024 / 1024 / 1024).toFixed(1),
            usePercent: parseFloat(d.use.toFixed(1)),
            bar: emojiBar(d.use),
            status: statusEmoji(d.use),
          })),
        },
      }, null, 2);
    },
  });

  
  server.addTool({
    name: "get_software_versions",
    description: "获取已安装软件版本信息。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji，不要省略",
    parameters: z.object({}),
    execute: async () => {
      const versions = await si.versions();

      // 按软件类型分类，定义分类顺序
      const categories: Record<string, string[]> = {
        "系统": ["kernel"],
        "语言运行时": ["python", "python3", "java", "php", "perl", "gcc", "dotnet"],
        "JS 生态": ["node", "npm", "v8", "bun", "deno", "yarn", "tsc", "pm2", "grunt", "gulp"],
        "Shell": ["bash", "zsh", "fish", "powershell"],
        "数据库": ["mysql", "postgresql", "redis", "mongodb"],
        "Web 服务器": ["nginx", "apache"],
        "容器/虚拟化": ["docker", "virtualbox"],
        "版本控制": ["git"],
        "包管理": ["pip", "pip3", "homebrew"],
        "加密": ["openssl", "systemOpenssl", "systemOpensslLib"],
        "邮件": ["postfix"],
      };

      // 按分类排序，未分类的追加到末尾
      const sorted: [string, string][] = [];
      const seen = new Set<string>();
      for (const items of Object.values(categories)) {
        for (const key of items) {
          const v = (versions as Record<string, unknown>)[key];
          if (typeof v === "string" && v.length > 0) {
            sorted.push([key, v]);
            seen.add(key);
          }
        }
      }
      // 追加未分类字段
      for (const [key, v] of Object.entries(versions)) {
        if (!seen.has(key) && typeof v === "string" && v.length > 0) {
          sorted.push([key, v]);
        }
      }

      const installed = sorted.map(([key, version]) => ({
        icon: "📦",
        label: key,
        value: version,
      }));

      return JSON.stringify({
        renderGuide,
        data: {
          title: "📦 已安装软件",
          software: installed,
        },
      }, null, 2);
    },
  });

  server.addTool({
    name: "get_network_chart",
    description: "获取网络接口信息。⚠️ 必须严格按照 renderGuide 渲染，完整输出所有 emoji 和进度条，不要省略",
    parameters: z.object({}),
    execute: async () => {
      const interfaces = await si.networkInterfaces();

      return JSON.stringify({
        renderGuide,
        data: {
          title: "🌐 网络接口信息",
          distribution: {
            internal: interfaces.filter((i) => i.internal).length,
            external: interfaces.filter((i) => !i.internal).length,
          },
          interfaces: interfaces.map((i) => ({
            iface: i.iface,
            ip4: i.ip4 || "N/A",
            mac: i.mac,
            speed: (i.speed ?? 0) > 0 ? `${i.speed} Mbps` : "N/A",
            operstate: i.operstate,
          })),
        },
      }, null, 2);
    },
  });
}
