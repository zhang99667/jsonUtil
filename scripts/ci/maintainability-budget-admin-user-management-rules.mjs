const adminUserManagementBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const adminUserManagementMaintainabilityBudgets = [
  adminUserManagementBudget('scripts/ci/maintainability-budget-admin-user-management-rules.mjs', 15, '用户管理预算表只维护账号页面、共用列表控制器、请求类型、纯模型、异常边界和直接回归测试'),
  adminUserManagementBudget('frontend/src/admin/pages/UserManagement.tsx', 480, '用户管理页面只编排列表适配、表单和账号操作，共用请求状态与展示规则下沉'),
  adminUserManagementBudget('frontend/src/admin/utils/listRequestController.ts', 120, '管理列表控制器只维护挂载状态、请求竞态、最新查询和末页回退'),
  adminUserManagementBudget('frontend/src/admin/utils/listRequestController.test.ts', 250, '管理列表控制器测试只锁定竞态、卸载、错误、连续回退和分页适配边界'),
  adminUserManagementBudget('frontend/src/admin/pages/UserManagementModel.ts', 50, '用户管理纯模型只维护时间展示和更新参数构造边界'),
  adminUserManagementBudget('frontend/src/admin/pages/UserManagement.test.ts', 70, '用户管理模型测试只锁定非法时间和空密码提交边界'),
  adminUserManagementBudget('frontend/src/admin/pages/UserManagementErrors.ts', 35, '用户管理异常边界只区分表单校验、已处理请求错误和未知异常'),
  adminUserManagementBudget('frontend/src/admin/pages/UserManagementErrors.test.ts', 70, '用户管理异常测试只锁定错误分类、提示去重和未知异常兜底'),
  adminUserManagementBudget('frontend/src/admin/services/user.ts', 100, '用户管理请求模块只维护闭集角色、分页和写操作契约'),
  adminUserManagementBudget('backend/src/test/java/com/jsonhelper/backend/service/UserServiceUsernameNormalizationTest.java', 160, '用户名规范化测试只锁定 Unicode 空白、冲突查询和保存边界'),
];
