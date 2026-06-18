/** Iconify API 搜索响应中的图标集元数据 */
export interface IconifyCollectionInfo {
  name?: string;
  total?: number;
  author?: { name: string; url?: string };
  license?: { title: string; spdx?: string; url?: string };
  samples?: string[];
  height?: number | number[];
  displayHeight?: number;
  category?: string;
  palette?: boolean;
}

/** Iconify API 搜索响应结构 */
export interface IconifySearchResponse {
  icons: string[];
  total: number;
  limit: number;
  start: number;
  collections: Record<string, IconifyCollectionInfo>;
  request: Record<string, string>;
}

/** 搜索参数（Zod 校验后的值） */
export interface SearchParams {
  query: string;
  limit?: number;
  start?: number;
  prefix?: string;
  prefixes?: string;
  category?: string;
  palette?: "color" | "mono";
}

/** 返回给 MCP 客户端的图标详情 */
export interface IconDetail {
  id: string;
  prefix: string;
  name: string;
  collectionName: string;
  palette: boolean | null;
  svgUrl: string;
}

/** 精简的图标集元数据 */
export interface CollectionSummary {
  name?: string;
  palette?: boolean;
  category?: string;
  height?: number | number[];
}
