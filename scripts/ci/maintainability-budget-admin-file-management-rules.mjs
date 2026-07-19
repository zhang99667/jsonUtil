const adminFileBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const adminFileManagementMaintainabilityBudgets = [
  adminFileBudget('scripts/ci/maintainability-budget-admin-file-management-rules.mjs', 15, '后台文件管理预算表只维护前端文件传输边界及其测试预算'),
  adminFileBudget('frontend/src/admin/services/file.ts', 75, '文件服务只维护列表、预览、传输和删除请求契约'),
  adminFileBudget('frontend/src/admin/services/file.test.ts', 55, '文件服务测试只锁定 Blob 同一性、下载响应类型和浏览器 multipart 边界'),
];
