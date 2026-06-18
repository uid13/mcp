/**
 * Iconify API 搜索逻辑
 */

import type {
  IconifySearchResponse,
  SearchParams,
  IconDetail,
  CollectionSummary,
} from "./types.js";

const ICONIFY_SEARCH_URL = "https://api.iconify.design/search";

/**
 * 从 API 搜索图标
 */
export async function searchIcons(
  params: SearchParams,
): Promise<{
  icons: IconDetail[];
  total: number;
  originalTotal: number;
  limit: number;
  start: number;
  filtered: boolean;
  collections: Record<string, CollectionSummary>;
}> {
  // 构造搜索参数
  const urlParams = new URLSearchParams();
  urlParams.set("query", params.query);
  if (params.limit !== undefined) urlParams.set("limit", String(params.limit));
  if (params.start !== undefined && params.start > 0)
    urlParams.set("start", String(params.start));
  if (params.prefix) urlParams.set("prefix", params.prefix);
  if (params.prefixes) urlParams.set("prefixes", params.prefixes);
  if (params.category) urlParams.set("category", params.category);

  const url = `${ICONIFY_SEARCH_URL}?${urlParams.toString()}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Iconify API 请求失败: HTTP ${response.status}`);
  }

  const data = (await response.json()) as IconifySearchResponse;

  // 客户端按彩色/单色过滤
  let icons = data.icons;
  let filtered = false;

  if (params.palette && icons.length > 0) {
    const targetPalette = params.palette === "color";
    icons = icons.filter((icon) => {
      const prefixName = icon.split(":")[0];
      const collection = data.collections[prefixName];
      return collection?.palette === targetPalette;
    });
    filtered = true;
  }

  // 构建图标详情
  const iconDetails: IconDetail[] = icons.map((id) => {
    const prefixName = id.split(":")[0];
    const iconName = id.split(":")[1];
    const collection = data.collections[prefixName];
    return {
      id,
      prefix: prefixName,
      name: iconName,
      collectionName: collection?.name || prefixName,
      palette: collection?.palette ?? null,
      svgUrl: `https://api.iconify.design/${prefixName}/${iconName}.svg`,
    };
  });

  // 精简 collections 元数据
  const collectionsSummary: Record<string, CollectionSummary> = {};
  for (const [key, info] of Object.entries(data.collections)) {
    collectionsSummary[key] = {
      name: info.name,
      palette: info.palette,
      category: info.category,
      height: info.height,
    };
  }

  return {
    icons: iconDetails,
    total: icons.length,
    originalTotal: data.total,
    limit: data.limit,
    start: data.start,
    filtered,
    collections: collectionsSummary,
  };
}
