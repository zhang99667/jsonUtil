export const appSourceValidationMaintainabilityBudgets = [
  { file: 'frontend/src/hooks/useAppSourceValidation.ts', maxLines: 45, reason: 'SOURCE 校验 hook 只维护输入防抖和未完成任务清理' },
  { file: 'frontend/src/hooks/useAppSourceValidation.test.ts', maxLines: 85, reason: 'SOURCE 校验 hook 测试只锁定 debounce 和 cleanup 生命周期' },
  { file: 'frontend/src/utils/appSourceValidationRequest.ts', maxLines: 55, reason: 'SOURCE 校验请求 helper 只维护清洗、requestId 防串写和空输入恢复' },
  { file: 'frontend/src/utils/appSourceValidationRequest.test.ts', maxLines: 115, reason: 'SOURCE 校验请求测试只锁定清洗启动、空输入和旧请求晚到保护' },
];
