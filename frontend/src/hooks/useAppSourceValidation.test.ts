import { describe, expect, it } from 'vitest';
import {
  advanceSourceValidationDebounce,
  captureSourceValidationCleanup,
  createCancellableValidationTask,
  getRunAppSourceValidationRequestMock,
  mockSourceValidationRequestIdRef,
  setupAppSourceValidationHookTest,
  useSourceValidationHookForTest,
} from './useAppSourceValidationTestFixture';

describe('useAppSourceValidation', () => {
  setupAppSourceValidationHookTest();

  it('防抖后启动 SOURCE 校验请求', async () => {
    const { onSetValidation } = useSourceValidationHookForTest('  {"a":1}  ');

    expect(getRunAppSourceValidationRequestMock()).not.toHaveBeenCalled();

    await advanceSourceValidationDebounce();

    expect(getRunAppSourceValidationRequestMock()).toHaveBeenCalledWith(expect.objectContaining({
      input: '  {"a":1}  ',
      onSetValidation,
    }));
  });

  it('空 SOURCE 输入立即启动校验以清理旧错误', () => {
    const { onSetValidation } = useSourceValidationHookForTest(' \u200B  ');

    expect(getRunAppSourceValidationRequestMock()).toHaveBeenCalledWith(expect.objectContaining({
      input: ' \u200B  ',
      onSetValidation,
    }));
  });

  it('清理 effect 时取消已启动任务并失效旧结果', async () => {
    const validationTask = createCancellableValidationTask();
    const requestIdRef = { current: 7 };
    mockSourceValidationRequestIdRef(requestIdRef);
    getRunAppSourceValidationRequestMock().mockReturnValue(validationTask);
    const cleanup = captureSourceValidationCleanup();

    useSourceValidationHookForTest('{"a":1}');
    await advanceSourceValidationDebounce();
    cleanup();

    expect(validationTask.cancel).toHaveBeenCalledTimes(1);
    expect(requestIdRef.current).toBe(8);
  });
});
