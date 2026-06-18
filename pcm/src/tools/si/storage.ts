import si from "systeminformation";
import { emojiBar, statusEmoji, renderGuide } from "./render-guide.js";

/** 内存使用详情 */
export async function memoryChartHandler(): Promise<string> {
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
}

/** 磁盘使用详情 */
export async function diskChartHandler(): Promise<string> {
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
}
