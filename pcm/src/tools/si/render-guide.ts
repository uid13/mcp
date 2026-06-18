/** 生成 emoji 进度条，每个方块代表 10% */
export function emojiBar(percent: number): string {
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
export function statusEmoji(percent: number): string {
  if (percent > 90) return "🔴";
  if (percent > 70) return "🟡";
  return "🟢";
}

/** 统一渲染元数据 */
export const renderGuide = {
  layout: [
    "每项数据使用三级标题 `###`",
    "百分比指标用 renderGuide.progressbar 格式展示进度条",
  ],
  progressbar: "格式：` 🟩⬜ 15% `",
  statusIcon: "每项百分比指标后面必须附带状态 emoji：>90% 用 🔴，70-90% 用 🟡，<70% 用 🟢",
  table: "表格每行开头必须带对应的 emoji 图标，不要省略任何 emoji",
  output: "必须完整输出所有数据和 emoji，不要省略、不要改写进度条和表格内容。可以在最后附加简短分析",
};
