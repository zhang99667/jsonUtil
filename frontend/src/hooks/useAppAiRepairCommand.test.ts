import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProvider, TransformMode } from '../types';
import { runAppAiRepairCommand } from '../utils/appAiRepairCommandRunner';
import { useAppAiRepairCommand } from './useAppAiRepairCommand';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useLayoutEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useLayoutEffect: reactMocks.useLayoutEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));

vi.mock('../utils/appAiRepairCommandRunner', () => ({
  loadAppAiRepairRuntime: vi.fn(),
  runAppAiRepairCommand: vi.fn(),
}));
vi.mock('../utils/toast', () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

const aiConfig = { provider: AIProvider.GEMINI, apiKey: 'key', model: 'gemini-2.0-flash' };

const repairSummary = {
  changed: true,
  repairMethod: 'local' as const,
  localRuleLabels: [],
  beforeLength: 6,
  afterLength: 11,
  beforeLines: 1,
  afterLines: 1,
  addedChars: 5,
  removedChars: 0,
  changedChunks: 1,
  rootDescription: '对象',
  previewItems: [],
  isPreviewTruncated: false,
  isDiffSkipped: false,
};

const createHookInput = (sourceText: string, activeFileId: string | null = null) => ({
  activeFileId,
  sourceText,
  aiConfig,
  onApplyFixedJson: vi.fn(),
  onSetMode: vi.fn(),
  onOpenAiSettings: vi.fn(),
  onTriggerFeatureFirstUse: vi.fn(),
  onTrackToolEvent: vi.fn(),
});

describe('useAppAiRepairCommand', () => {
  let refIndex = 0;
  let abortControllerRef: { current: AbortController | null };
  let latestSourceRef: { current: { activeFileId: string | null; sourceText: string } };
  let setIsAiRepairing: ReturnType<typeof vi.fn>;
  let runEffectsInStrictMode = false;

  beforeEach(() => {
    vi.clearAllMocks();
    refIndex = 0;
    runEffectsInStrictMode = false;
    abortControllerRef = { current: null };
    latestSourceRef = { current: { activeFileId: null, sourceText: '' } };
    setIsAiRepairing = vi.fn();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useLayoutEffect.mockImplementation((effect: () => void) => effect());
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
      const cleanup = effect();
      if (runEffectsInStrictMode && cleanup) {
        cleanup();
        effect();
      }
      return cleanup;
    });
    reactMocks.useState.mockReturnValue([false, setIsAiRepairing]);
    reactMocks.useRef.mockImplementation((initialValue: unknown) => {
      const refs = [abortControllerRef, latestSourceRef];
      return refs[refIndex++] ?? { current: initialValue };
    });
  });

  const useAiRepairHookForTest = (sourceText: string, activeFileId: string | null = null) => {
    refIndex = 0;
    return useAppAiRepairCommand(createHookInput(sourceText, activeFileId));
  };

  it('SOURCE 内容变化时取消进行中的 AI 修复请求', async () => {
    let resolveRun: (() => void) | undefined;
    let repairSignal: AbortSignal | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async input => {
      repairSignal = input.signal;
      await new Promise<void>(resolve => { resolveRun = resolve; });
    });

    const { handleAiRepair } = useAiRepairHookForTest('{bad:}', 'file-a');
    const repairPromise = handleAiRepair();

    expect(repairSignal?.aborted).toBe(false);
    useAiRepairHookForTest('{edited:true}', 'file-a');
    expect(repairSignal?.aborted).toBe(true);

    resolveRun?.();
    await repairPromise;
  });

  it('相同 SOURCE 切换活动文件后忽略旧修复回调', async () => {
    let capturedEffects: Parameters<typeof runAppAiRepairCommand>[1] | undefined;
    let releaseRun: (() => void) | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      capturedEffects = effects;
      await new Promise<void>(resolve => { releaseRun = resolve; });
    });
    const firstInput = createHookInput('{bad:}', 'file-a');
    refIndex = 0;
    const repairPromise = useAppAiRepairCommand(firstInput).handleAiRepair();

    reactMocks.useEffect.mockImplementation(() => undefined);
    useAiRepairHookForTest('{bad:}', 'file-b');
    capturedEffects?.onApplyFixedJson('{"ok":true}', repairSummary);

    expect(firstInput.onApplyFixedJson).not.toHaveBeenCalled();
    releaseRun?.();
    await repairPromise;
  });

  it('SOURCE 变化后忽略晚到的修复界面回调', async () => {
    let capturedEffects: Parameters<typeof runAppAiRepairCommand>[1] | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      capturedEffects = effects;
    });
    const hookInput = createHookInput('{bad:}');
    refIndex = 0;
    const { handleAiRepair } = useAppAiRepairCommand(hookInput);

    await handleAiRepair();
    useAiRepairHookForTest('{edited:true}');
    capturedEffects?.onApplyFixedJson('{"ok":true}', repairSummary);
    capturedEffects?.onSetMode(TransformMode.FORMAT);
    capturedEffects?.onOpenAiSettings();

    expect(hookInput.onApplyFixedJson).not.toHaveBeenCalled();
    expect(hookInput.onSetMode).not.toHaveBeenCalled();
    expect(hookInput.onOpenAiSettings).not.toHaveBeenCalled();
  });

  it('StrictMode 重放 effect 后仍应处理当前修复回调', async () => {
    runEffectsInStrictMode = true;
    const hookInput = createHookInput('{bad:}', 'file-a');
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      effects.onSetRepairing(true);
      effects.onApplyFixedJson('{"ok":true}', repairSummary);
      effects.onSetRepairing(false);
    });

    refIndex = 0;
    await useAppAiRepairCommand(hookInput).handleAiRepair();

    expect(setIsAiRepairing).toHaveBeenNthCalledWith(1, true);
    expect(setIsAiRepairing).toHaveBeenLastCalledWith(false);
    expect(hookInput.onApplyFixedJson).toHaveBeenCalledWith('{"ok":true}', repairSummary);
  });

  it('切换 SOURCE 后立即结束旧加载且不让旧请求覆盖新加载状态', async () => {
    const releaseRuns: Array<() => void> = [];
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      effects.onSetRepairing(true);
      await new Promise<void>(resolve => { releaseRuns.push(resolve); });
      effects.onSetRepairing(false);
    });

    const firstRepair = useAiRepairHookForTest('{bad:}').handleAiRepair();
    expect(setIsAiRepairing).toHaveBeenLastCalledWith(true);

    const secondHook = useAiRepairHookForTest('{edited:true}');
    expect(setIsAiRepairing).toHaveBeenLastCalledWith(false);

    const secondRepair = secondHook.handleAiRepair();
    expect(setIsAiRepairing).toHaveBeenLastCalledWith(true);

    releaseRuns[0]?.();
    await firstRepair;
    expect(setIsAiRepairing).toHaveBeenLastCalledWith(true);

    releaseRuns[1]?.();
    await secondRepair;
    expect(setIsAiRepairing).toHaveBeenLastCalledWith(false);
  });

  it('未提交的 SOURCE 渲染不应使当前修复结果失效', async () => {
    let capturedEffects: Parameters<typeof runAppAiRepairCommand>[1] | undefined;
    let releaseRun: (() => void) | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async (_input, effects) => {
      capturedEffects = effects;
      await new Promise<void>(resolve => { releaseRun = resolve; });
    });
    const hookInput = createHookInput('{bad:}', 'file-a');
    const repairPromise = useAppAiRepairCommand(hookInput).handleAiRepair();
    reactMocks.useEffect.mockImplementation(() => undefined);
    reactMocks.useLayoutEffect.mockImplementation(() => undefined);
    useAiRepairHookForTest('{draft:true}', 'file-a');
    capturedEffects?.onApplyFixedJson('{"ok":true}', repairSummary);
    expect(hookInput.onApplyFixedJson).toHaveBeenCalledWith('{"ok":true}', repairSummary);
    releaseRun?.();
    await repairPromise;
  });
});
