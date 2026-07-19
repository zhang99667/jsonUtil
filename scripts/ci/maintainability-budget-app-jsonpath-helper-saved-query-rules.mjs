const appJsonPathHelperSavedQueryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const appJsonPathHelperSavedQueryMaintainabilityBudgets = [
  appJsonPathHelperSavedQueryBudget('frontend/src/hooks/useJsonPathSavedQueryLists.ts', 95, 'JSONPath 保存查询 hook 只维护收藏/历史初始化、存储同步接线和增删操作'),
  appJsonPathHelperSavedQueryBudget('frontend/src/hooks/useJsonPathSavedQueryLists.test.ts', 125, 'JSONPath 保存查询 hook 测试只锁定初始化、存储同步接线和列表 updater'),
  appJsonPathHelperSavedQueryBudget('frontend/src/hooks/useJsonPathSavedQueryListStorageSync.ts', 55, 'JSONPath 保存查询 storage sync hook 只维护历史收藏持久化、历史清理和备份导入刷新'),
  appJsonPathHelperSavedQueryBudget('frontend/src/hooks/useJsonPathSavedQueryListStorageSync.test.ts', 80, 'JSONPath 保存查询 storage sync 测试只锁定持久化、历史清理、备份刷新、监听清理和无 window 降级'),
  appJsonPathHelperSavedQueryBudget('frontend/src/hooks/useJsonPathSavedQueryListStorageSyncTestHarness.ts', 60, 'JSONPath 保存查询 storage sync 测试夹具只维护默认参数、窗口监听捕获、监听断言和 effect cleanup 模拟'),
  appJsonPathHelperSavedQueryBudget('frontend/src/utils/jsonPathSavedQueryListActions.ts', 55, 'JSONPath 保存查询列表 action helper 只维护历史和收藏的纯状态转移'),
  appJsonPathHelperSavedQueryBudget('frontend/src/utils/jsonPathSavedQueryListActions.test.ts', 65, 'JSONPath 保存查询列表 action 测试只锁定历史收藏增删和切换'),
  appJsonPathHelperSavedQueryBudget('frontend/src/utils/jsonPathSavedQueryStorage.ts', 55, 'JSONPath 保存查询 storage helper 只维护历史收藏读写、清理和导入归一化'),
  appJsonPathHelperSavedQueryBudget('frontend/src/utils/jsonPathSavedQueryStorage.test.ts', 90, 'JSONPath 保存查询 storage 测试只锁定 storage key、数组格式和导入归一化'),
  appJsonPathHelperSavedQueryBudget('frontend/src/utils/recentStringLists.ts', 50, '最近字符串列表工具只维护上限归一、清洗去重与增删规则'),
  appJsonPathHelperSavedQueryBudget('frontend/src/utils/recentStringLists.test.ts', 105, '最近字符串列表测试只锁定默认上限、异常上限、顺序、大小写、尾部读取和损坏存储'),
];
