export const appSourceValidationMaintainabilityBudgets = [
  { file: 'frontend/src/hooks/useAppSourceValidation.ts', maxLines: 45, reason: 'SOURCE 校验 hook 只维护输入防抖和未完成任务清理' },
  { file: 'frontend/src/hooks/useAppSourceValidation.test.ts', maxLines: 85, reason: 'SOURCE 校验 hook 测试只锁定 debounce 和 cleanup 生命周期' },
  { file: 'frontend/src/utils/appSourceValidationRequest.ts', maxLines: 55, reason: 'SOURCE 校验请求 helper 只维护清洗、requestId 防串写和空输入恢复' },
  { file: 'frontend/src/utils/appSourceValidationRequest.test.ts', maxLines: 115, reason: 'SOURCE 校验请求测试只锁定清洗启动、空输入和旧请求晚到保护' },
  { file: 'frontend/src/utils/appSourceValidationRequestTestFixture.ts', maxLines: 50, reason: 'SOURCE 校验请求 fixture 只提供默认入参和 validation task 工厂' },
  { file: 'frontend/src/utils/jsonValidationErrorLocation.ts', maxLines: 105, reason: 'JSON 错误定位只维护运行时行列、字符位置和逐行格式坐标转换' },
  { file: 'frontend/src/utils/jsonValidation.test.ts', maxLines: 170, reason: 'JSON 校验测试锁定输入清理、错误坐标和异步任务生命周期' },
  { file: 'frontend/src/utils/jsonLines.ts', maxLines: 80, reason: 'JSON Lines 工具只维护逐行识别、解析、定位和序列化边界' },
  { file: 'frontend/src/utils/jsonLines.test.ts', maxLines: 30, reason: 'JSON Lines 直接测试锁定原始位置和非有限数值拒绝行为' },
];
