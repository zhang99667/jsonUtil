const backendTrafficBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const backendTrafficMaintainabilityBudgets = [
  backendTrafficBudget('scripts/ci/maintainability-budget-backend-traffic-rules.mjs', 25, '后端流量预算表只维护流量、匿名事件请求边界及其测试预算'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/controller/VisitorController.java', 40, '访客控制器只维护健康探针和经过标准校验的匿名事件入口'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/dto/ToolEventRequest.java', 80, '匿名事件请求只声明受限文本和闭集分桶契约'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/repository/VisitLogRepository.java', 150, '访问日志仓储只维护类型化聚合投影查询和带抓取批次的会话事件流'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/security/TrafficFilter.java', 80, '访问日志过滤器只读取容器已解析的远端地址并旁路保存受限请求元数据'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/service/TrafficService.java', 565, '流量服务只编排同快照统计查询、聚合和受管会话事件流，不再内嵌来源地址解析'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/service/ToolEventService.java', 100, '工具事件服务只保存经过请求校验的匿名事件并维护同一只读快照内的统计聚合'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/service/GeoService.java', 215, '地理服务只维护 IP 字面量分类、ip2region 查询和地区字段归一'),
  backendTrafficBudget('backend/src/main/java/com/jsonhelper/backend/service/RefererSourceClassifier.java', 105, '来源分类器只按网页协议和主机名完成确定性分类'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/service/TrafficServiceTest.java', 340, '流量服务测试只锁定类型化查询、聚合、会话统计和事件流关闭'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/service/TrafficServiceProjectionTest.java', 110, '流量投影测试只锁定日期、小时与聚合数量的类型化读取'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/service/ToolEventServiceTest.java', 140, '工具事件测试只锁定已校验字段直写、统计聚合和 Spring 事务快照契约'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/controller/VisitorControllerTest.java', 120, '访客控制器测试只锁定匿名事件请求校验和服务调用边界'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/config/ForwardedHeaderConfigurationTest.java', 65, '转发头配置测试只锁定 Tomcat 原生策略、标准头名和可信代理边界'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/security/TrafficFilterTest.java', 90, '访问日志过滤器测试只锁定旁路行为、容器远端地址和请求放行'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/service/GeoServiceTest.java', 55, '地理服务测试只锁定本地、内网、公网和畸形 IP 字面量分类'),
  backendTrafficBudget('backend/src/test/java/com/jsonhelper/backend/service/RefererSourceClassifierTest.java', 60, '来源分类测试只覆盖可信主机名、伪装地址和非法输入边界'),
];
