const backendRequestBoundaryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const backendRequestBoundaryMaintainabilityBudgets = [
  backendRequestBoundaryBudget('scripts/ci/maintainability-budget-backend-request-boundary-rules.mjs', 15, '后端请求边界预算表只维护跨域、严格 JSON、统一异常响应及其测试预算'),
  backendRequestBoundaryBudget('backend/src/main/java/com/jsonhelper/backend/config/CorsConfig.java', 55, '跨域配置只维护固定来源、方法、请求头、凭证和接口路径契约'),
  backendRequestBoundaryBudget('backend/src/test/java/com/jsonhelper/backend/config/CorsConfigTest.java', 65, '跨域配置测试只锁定接口路径匹配和完整公开配置'),
  backendRequestBoundaryBudget('backend/src/main/java/com/jsonhelper/backend/config/StrictJsonConfig.java', 35, '严格 JSON 配置只使用 Jackson 标准能力拒绝未知字段和文本标量强制转换'),
  backendRequestBoundaryBudget('backend/src/main/java/com/jsonhelper/backend/common/exception/GlobalExceptionHandler.java', 110, '全局异常处理器只负责框架状态、稳定错误响应和脱敏日志'),
  backendRequestBoundaryBudget('backend/src/test/java/com/jsonhelper/backend/common/exception/GlobalExceptionHandlerTest.java', 185, '异常处理器单元测试只锁定框架分派、已提交响应、稳定响应和日志脱敏边界'),
  backendRequestBoundaryBudget('backend/src/test/java/com/jsonhelper/backend/common/exception/GlobalExceptionHandlerMvcTest.java', 125, '异常处理器 MVC 测试只锁定框架状态、响应头和统一响应体'),
];
