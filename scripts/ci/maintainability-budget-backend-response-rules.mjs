const backendResponseBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const backendResponseMaintainabilityBudgets = [
  backendResponseBudget('scripts/ci/maintainability-budget-backend-response-rules.mjs', 25, '后端响应预算表只维护统一响应和不可变统计投影'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/Result.java', 25, '统一响应只维护关闭的成功与失败构造状态'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/DailyTrendDTO.java', 15, '每日趋势响应只声明不可变日期与访问指标'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/DeviceStatsDTO.java', 15, '访问端响应只声明不可变分类与占比指标'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/GeoStatsDTO.java', 15, '地理响应只声明不可变地区与占比指标'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/HourlyStatsDTO.java', 15, '小时响应只声明不可变小时与访问量'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/IpStatsDTO.java', 15, '地址响应只声明不可变地址、地区与访问量'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/PathStatsDTO.java', 15, '路径响应只声明不可变路径与访问量'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/RefererStatsDTO.java', 15, '来源响应只声明不可变来源、域名与占比指标'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/SessionStatsDTO.java', 15, '会话响应只声明不可变时长与占比指标'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/StatisticsDTO.java', 20, '总览响应只声明不可变用户、订阅、收入和流量指标'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/ToolEventGroupDTO.java', 15, '事件分组响应只声明不可变标签与占比指标'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/ToolEventStatsDTO.java', 25, '事件统计响应只声明不可变总量与分组列表快照'),
  backendResponseBudget('backend/src/main/java/com/jsonhelper/backend/dto/response/TrafficOverviewDTO.java', 20, '流量总览响应只声明不可变访问指标与统计天数'),
  backendResponseBudget('backend/src/test/java/com/jsonhelper/backend/dto/response/ResponseDtoImmutabilityTest.java', 145, '响应契约测试只锁定字段、设置器、集合快照、工厂状态和序列化字段'),
];
