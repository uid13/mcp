/**
 * 生成模型渲染指引文本
 */
export function buildRenderGuide(): string[] {
  return [
    "用表格展示，每行 13 个图标：",
    "![{name}](https://api.iconify.design/{prefix}/{name}.svg?width=32&height=32)",
    "必须把彩色图标排在前面，单色图标排在后面。",
  ];
}
