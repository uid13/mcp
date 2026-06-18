import si from "systeminformation";
import { renderGuide } from "./render-guide.js";

/** 网络接口信息 */
export async function networkChartHandler(): Promise<string> {
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
}
