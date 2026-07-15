/** 管理后台分页列表的完整查询条件 */
export interface AdminListQuery {
  page: number;
  pageSize: number;
  keyword: string;
}

/**
 * 根据服务端返回的最新总数修正越界页码。
 * 查询仍在有效页时复用原对象，便于调用方跳过多余请求。
 */
export const resolveAvailableListQuery = (
  query: AdminListQuery,
  total: number,
): AdminListQuery => {
  const lastPage = Math.max(1, Math.ceil(Math.max(0, total) / query.pageSize));
  return query.page > lastPage ? { ...query, page: lastPage } : query;
};
