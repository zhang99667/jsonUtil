const adminTrafficBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const adminTrafficMaintainabilityBudgets = [
  adminTrafficBudget('scripts/ci/maintainability-budget-admin-traffic-rules.mjs', 15, '后台流量预算表只维护流量页面、请求服务及其直接回归测试'),
  adminTrafficBudget('frontend/src/admin/pages/TrafficStats.tsx', 500, '流量统计页面只编排数据、表格列、趋势图和分布区块'),
  adminTrafficBudget('frontend/src/admin/components/TrafficOverviewCards.tsx', 115, '流量概览卡只维护四项权威指标及其响应式展示'),
  adminTrafficBudget('frontend/src/admin/components/ToolEventInsightsCard.tsx', 390, '工具事件卡只维护洞察、周报和事件分布展示'),
  adminTrafficBudget('frontend/src/admin/components/DistributionListCard.tsx', 95, '分布列表只维护统一计数、进度和空态展示'),
  adminTrafficBudget('frontend/src/admin/pages/TrafficStats.test.tsx', 90, '流量统计页面测试只锁定权威概览、排行和工具洞察集成契约'),
  adminTrafficBudget('frontend/src/admin/services/traffic.ts', 120, '流量请求服务只维护响应类型和统一查询编排，不重复解释端点名称'),
  adminTrafficBudget('frontend/src/admin/services/traffic.test.ts', 70, '流量请求测试以参数化矩阵锁定全部端点、查询参数和默认限额'),
];
