import si from "systeminformation";
import { emojiBar, statusEmoji, renderGuide } from "./render-guide.js";

/** 系统仪表盘 */
export async function systemDashboardHandler(): Promise<string> {
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
}

/** CPU 使用率分析 */
export async function cpuChartHandler(): Promise<string> {
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
}
