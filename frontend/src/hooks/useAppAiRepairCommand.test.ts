import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProvider, TransformMode } from '../types';
import { runAppAiRepairCommand } from '../utils/appAiRepairCommandRunner';
import { useAppAiRepairCommand } from './useAppAiRepairCommand';

vi.mock('../utils/appAiRepairCommandRunner', () => ({
  loadAppAiRepairRuntime: vi.fn(),
  runAppAiRepairCommand: vi.fn(),
}));
vi.mock('../utils/toast', () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

const aiConfig = { provider: AIProvider.GEMINI, apiKey: 'key', model: 'gemini-2.0-flash' };
const repairSummary = {
  changed: true, repairMethod: 'local' as const,
  localRuleLabels: [],
  beforeLength: 6, afterLength: 11,
  beforeLines: 1, afterLines: 1,
  addedChars: 5, removedChars: 0, changedChunks: 1,
  rootDescription: '对象',
  previewItems: [], isPreviewTruncated: false, isDiffSkipped: false,
};

interface HookProps {
  sourceText: string;
  activeFileId: string | null;
}

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(currentResolve => { resolve = currentResolve; });
  return { promise, resolve };
};

const createHookScenario = (
  sourceText: string,
  activeFileId: string | null = null,
  reactStrictMode = false
) => {
  const callbacks = {
    onApplyFixedJson: vi.fn(),
    onSetMode: vi.fn(),
    onOpenAiSettings: vi.fn(),
    onTriggerFeatureFirstUse: vi.fn(),
    onTrackToolEvent: vi.fn(),
  };
  const hook = renderHook(({ sourceText: currentSource, activeFileId: currentFileId }: HookProps) => (
    useAppAiRepairCommand({
      ...callbacks,
      activeFileId: currentFileId,
      sourceText: currentSource,
      aiConfig,
    })
  ), {
    initialProps: { sourceText, activeFileId },
    reactStrictMode,
  });

  return { ...hook, callbacks };
};

describe('useAppAiRepairCommand', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(cleanup);

  it('SOURCE 内容变化时取消进行中的 AI 修复请求', async () => {
    const deferred = createDeferred();
    let repairSignal: AbortSignal | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async input => {
      repairSignal = input.signal;
      await deferred.promise;
    });
    const scenario = createHookScenario('{bad:}', 'file-a');
    let repairPromise!: Promise<void>;

    act(() => { repairPromise = scenario.result.current.handleAiRepair(); });
    expect(repairSignal?.aborted).toBe(false);
    scenario.rerender({ sourceText: '{edited:true}', activeFileId: 'file-a' });
    expect(repairSignal?.aborted).toBe(true);

    await act(async () => { deferred.resolve(); await repairPromise; });
  });

  it('相同 SOURCE 切换活动文件后取消旧修复并忽略回调', async () => {
    const deferred = createDeferred();
    let capturedEffects: Parameters<typeof runAppAiRepairCommand>[1] | undefined;
    let repairSignal: AbortSignal | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (input, effects) => {
      repairSignal = input.signal;
      capturedEffects = effects;
      await deferred.promise;
    });
    const scenario = createHookScenario('{bad:}', 'file-a');
    let repairPromise!: Promise<void>;

    act(() => { repairPromise = scenario.result.current.handleAiRepair(); });
    scenario.rerender({ sourceText: '{bad:}', activeFileId: 'file-b' });
    capturedEffects?.onApplyFixedJson('{"ok":true}', repairSummary);

    expect(repairSignal?.aborted).toBe(true);
    expect(scenario.callbacks.onApplyFixedJson).not.toHaveBeenCalled();
    await act(async () => { deferred.resolve(); await repairPromise; });
  });

  it('SOURCE 变化后忽略晚到的修复界面回调', async () => {
    let capturedEffects: Parameters<typeof runAppAiRepairCommand>[1] | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      capturedEffects = effects;
    });
    const scenario = createHookScenario('{bad:}');

    await act(async () => { await scenario.result.current.handleAiRepair(); });
    scenario.rerender({ sourceText: '{edited:true}', activeFileId: null });
    capturedEffects?.onApplyFixedJson('{"ok":true}', repairSummary);
    capturedEffects?.onSetMode(TransformMode.FORMAT);
    capturedEffects?.onOpenAiSettings();

    expect(scenario.callbacks.onApplyFixedJson).not.toHaveBeenCalled();
    expect(scenario.callbacks.onSetMode).not.toHaveBeenCalled();
    expect(scenario.callbacks.onOpenAiSettings).not.toHaveBeenCalled();
  });

  it('StrictMode 重放生命周期后仍处理当前修复回调和加载状态', async () => {
    const deferred = createDeferred();
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      effects.onSetRepairing(true);
      await deferred.promise;
      effects.onApplyFixedJson('{"ok":true}', repairSummary);
      effects.onSetRepairing(false);
    });
    const scenario = createHookScenario('{bad:}', 'file-a', true);
    let repairPromise!: Promise<void>;

    act(() => { repairPromise = scenario.result.current.handleAiRepair(); });
    expect(scenario.result.current.isAiRepairing).toBe(true);
    await act(async () => { deferred.resolve(); await repairPromise; });

    expect(scenario.result.current.isAiRepairing).toBe(false);
    expect(scenario.callbacks.onApplyFixedJson).toHaveBeenCalledWith('{"ok":true}', repairSummary);
  });

  it('首次使用回调异常后释放请求并允许重试', async () => {
    const scenario = createHookScenario('{bad:}');
    scenario.callbacks.onTriggerFeatureFirstUse.mockImplementationOnce(() => {
      throw new Error('引导失败');
    });
    vi.mocked(runAppAiRepairCommand).mockResolvedValue(undefined);

    await act(async () => {
      await expect(scenario.result.current.handleAiRepair()).rejects.toThrow('引导失败');
    });
    await act(async () => { await scenario.result.current.handleAiRepair(); });

    expect(runAppAiRepairCommand).toHaveBeenCalledOnce();
  });

  it('执行器异常后结束加载并允许重试', async () => {
    vi.mocked(runAppAiRepairCommand).mockImplementationOnce(async (_input, effects) => {
      effects.onSetRepairing(true);
      throw new Error('执行失败');
    }).mockResolvedValue(undefined);
    const scenario = createHookScenario('{bad:}');

    await act(async () => {
      await expect(scenario.result.current.handleAiRepair()).rejects.toThrow('执行失败');
    });
    expect(scenario.result.current.isAiRepairing).toBe(false);
    await act(async () => { await scenario.result.current.handleAiRepair(); });
    expect(runAppAiRepairCommand).toHaveBeenCalledTimes(2);
  });

  it('切换 SOURCE 后不让旧请求覆盖新加载状态', async () => {
    const deferredRuns = [createDeferred(), createDeferred()];
    let runIndex = 0;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      const deferred = deferredRuns[runIndex++];
      effects.onSetRepairing(true);
      await deferred.promise;
      effects.onSetRepairing(false);
    });
    const scenario = createHookScenario('{bad:}');
    let firstRepair!: Promise<void>;
    let secondRepair!: Promise<void>;

    act(() => { firstRepair = scenario.result.current.handleAiRepair(); });
    expect(scenario.result.current.isAiRepairing).toBe(true);
    scenario.rerender({ sourceText: '{edited:true}', activeFileId: null });
    expect(scenario.result.current.isAiRepairing).toBe(false);
    act(() => { secondRepair = scenario.result.current.handleAiRepair(); });
    expect(scenario.result.current.isAiRepairing).toBe(true);

    await act(async () => { deferredRuns[0].resolve(); await firstRepair; });
    expect(scenario.result.current.isAiRepairing).toBe(true);
    await act(async () => { deferredRuns[1].resolve(); await secondRepair; });
    expect(scenario.result.current.isAiRepairing).toBe(false);
  });

  it('卸载时取消请求并忽略晚到回调', async () => {
    const deferred = createDeferred();
    let capturedEffects: Parameters<typeof runAppAiRepairCommand>[1] | undefined;
    let repairSignal: AbortSignal | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (input, effects) => {
      repairSignal = input.signal;
      capturedEffects = effects;
      await deferred.promise;
    });
    const scenario = createHookScenario('{bad:}');
    let repairPromise!: Promise<void>;

    act(() => { repairPromise = scenario.result.current.handleAiRepair(); });
    scenario.unmount();
    capturedEffects?.onApplyFixedJson('{"ok":true}', repairSummary);

    expect(repairSignal?.aborted).toBe(true);
    expect(scenario.callbacks.onApplyFixedJson).not.toHaveBeenCalled();
    await act(async () => { deferred.resolve(); await repairPromise; });
  });
});
