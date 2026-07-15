export const appSourceValidationMaintainabilityBudgets = [
  { file: 'frontend/src/utils/jsonValidation.ts', maxLines: 190, reason: '共享 JSON 校验 helper 只维护输入清洗、同步校验和有界可取消 Worker 生命周期' },
  { file: 'frontend/src/utils/jsonValidationErrorLocation.ts', maxLines: 100, reason: 'JSON 错误定位 helper 只兼容标准解析位置、行列和 JSON Lines 行号' },
  { file: 'frontend/src/utils/jsonValidation.test.ts', maxLines: 160, reason: '共享 JSON 校验测试只锁定清洗、定位、Worker 异常和 AbortSignal 终止边界' },
  { file: 'frontend/src/utils/jsonValidationWorkerProtocol.test.ts', maxLines: 140, reason: 'Worker 协议测试只锁定请求标识、载荷结构、取消结算和终态后回调隔离' },
  { file: 'frontend/src/utils/jsonValidationWorkerTimeout.test.ts', maxLines: 60, reason: 'Worker 超时测试只锁定永久无响应的受控结果、线程终止和重复取消' },
  { file: 'frontend/src/hooks/useAppSourceValidation.ts', maxLines: 45, reason: 'SOURCE 校验 hook 只维护输入防抖和未完成任务清理' },
  { file: 'frontend/src/hooks/useAppSourceValidation.test.ts', maxLines: 85, reason: 'SOURCE 校验 hook 测试只锁定 debounce 和 cleanup 生命周期' },
  { file: 'frontend/src/utils/appSourceValidationRequest.ts', maxLines: 55, reason: 'SOURCE 校验请求 helper 只维护清洗、requestId 防串写和空输入恢复' },
  { file: 'frontend/src/utils/appSourceValidationRequest.test.ts', maxLines: 115, reason: 'SOURCE 校验请求测试只锁定清洗启动、空输入和旧请求晚到保护' },
  { file: 'frontend/src/utils/appSourceValidationRequestTestFixture.ts', maxLines: 50, reason: 'SOURCE 校验请求 fixture 只提供默认入参和 validation task 工厂' },
];
