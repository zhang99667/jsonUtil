const backendReportingBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const backendReportingMaintainabilityBudgets = [
  backendReportingBudget('scripts/ci/maintainability-budget-backend-reporting-rules.mjs', 10, '后端报表预算表只维护跨仓储总览和事务快照契约'),
  backendReportingBudget('backend/src/main/java/com/jsonhelper/backend/config/TimeConfig.java', 20, '统一时钟配置只注册服务器默认时区的应用时间源'),
  backendReportingBudget('backend/src/main/java/com/jsonhelper/backend/service/StatisticsService.java', 55, '后台总览服务只编排固定时钟同一只读快照内的跨仓储聚合'),
  backendReportingBudget('backend/src/test/java/com/jsonhelper/backend/config/TimeConfigTest.java', 20, '统一时钟配置测试只锁定服务器默认时区契约'),
  backendReportingBudget('backend/src/test/java/com/jsonhelper/backend/service/StatisticsServiceTest.java', 105, '后台总览测试只锁定固定查询时点、当天边界和聚合结果'),
  backendReportingBudget('backend/src/test/java/com/jsonhelper/backend/service/ReportingSnapshotTransactionTest.java', 50, '报表事务测试只锁定多查询快照和流式查询入口的只读事务契约'),
];
