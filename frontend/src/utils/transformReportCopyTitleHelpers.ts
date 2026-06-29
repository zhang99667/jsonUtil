export const getReportCopyTitle = (
  canCopy: boolean,
  hasReportView: boolean,
  isFilterPending: boolean,
  readyTitle: string,
  unavailableTitle: string
): string => {
  if (isFilterPending) return '筛选结果仍在更新，请稍后复制';
  if (!hasReportView) return '暂无深度解析报告可复制';
  if (!canCopy) return unavailableTitle;
  return readyTitle;
};
