/**
 * 分页配置
 */
export const ITEMS_PER_PAGE = 30;

/**
 * 分页结果接口
 */
export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * 对数组进行分页
 * @param items 要分页的数组
 * @param page 当前页码（从1开始）
 * @param itemsPerPage 每页条目数，默认30
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  itemsPerPage: number = ITEMS_PER_PAGE
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * 生成用于getStaticPaths的分页路径数组
 * @param totalItems 总条目数
 * @param itemsPerPage 每页条目数，默认30
 */
export function generatePaginationPaths(
  totalItems: number,
  itemsPerPage: number = ITEMS_PER_PAGE
): Array<{ params: { page: string } }> {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paths: Array<{ params: { page: string } }> = [];
  for (let page = 2; page <= totalPages; page++) {
    paths.push({ params: { page: String(page) } });
  }
  return paths;
}

/**
 * 从Astro路径参数中解析页码
 * @param pageParam Astro的page参数，格式为"page/2"或undefined
 */
export function parsePageParam(pageParam: string | undefined): number {
  if (!pageParam) return 1;
  if (!/^\d+$/.test(pageParam)) return 1;
  const n = parseInt(pageParam, 10);
  return Number.isNaN(n) ? 1 : Math.max(1, n);
}
