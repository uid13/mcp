import si from "systeminformation";
import { renderGuide } from "./render-guide.js";

/** 已安装软件版本 */
export async function softwareVersionsHandler(): Promise<string> {
  const versions = await si.versions();

  // 按软件类型分类
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
  for (const [key, v] of Object.entries(versions)) {
    if (!seen.has(key) && typeof v === "string" && v.length > 0) {
      sorted.push([key, v]);
    }
  }

  const installed = sorted.map(([key, version]) => ({
    label: key,
    value: version,
  }));

  return JSON.stringify({
    renderGuide: {
      ...renderGuide,
      softwareTable: "用三列表格展示：emoji | 软件 | 版本，每行软件请自行选择合适 emoji，例如 Node.js → 🟢，Docker → 🐳，Git → 📂",
    },
    data: {
      title: "📦 已安装软件",
      software: installed,
    },
  }, null, 2);
}
