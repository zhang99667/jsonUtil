import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProvider, TransformMode } from '../types';
import { runAppAiRepairCommand } from '../utils/appAiRepairCommandRunner';
import { useAppAiRepairCommand } from './useAppAiRepairCommand';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));

vi.mock('../utils/appAiRepairCommandRunner', () => ({
  loadAppAiRepairRuntime: vi.fn(),
  runAppAiRepairCommand: vi.fn(),
}));

vi.mock('../utils/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const aiConfig = {
  provider: AIProvider.GEMINI,
  apiKey: 'key',
  model: 'gemini-2.0-flash',
};

const createHookInput = (sourceText: string) => ({
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
  let mountedRef: { current: boolean };
  let abortControllerRef: { current: AbortController | null };
  let latestSourceTextRef: { current: string };

  beforeEach(() => {
    vi.clearAllMocks();
    refIndex = 0;
    mountedRef = { current: true };
    abortControllerRef = { current: null };
    latestSourceTextRef = { current: '' };
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => effect());
    reactMocks.useState.mockReturnValue([false, vi.fn()]);
    reactMocks.useRef.mockImplementation((initialValue: unknown) => {
      const refs = [mountedRef, abortControllerRef, latestSourceTextRef];
      const ref = refs[refIndex++] ?? { current: initialValue };
      if (ref === latestSourceTextRef && latestSourceTextRef.current === '') {
        latestSourceTextRef.current = initialValue as string;
      }
      return ref;
    });
  });

  const useAiRepairHookForTest = (sourceText: string) => {
    refIndex = 0;
    return useAppAiRepairCommand(createHookInput(sourceText));
  };

  it('SOURCE 变化时取消进行中的 AI 修复请求', async () => {
    let resolveRun: (() => void) | undefined;
    let repairSignal: AbortSignal | undefined;
    vi.mocked(runAppAiRepairCommand).mockImplementation(async input => {
      repairSignal = input.signal;
      await new Promise<void>(resolve => { resolveRun = resolve; });
    });

    const { handleAiRepair } = useAiRepairHookForTest('{bad:}');
    const repairPromise = handleAiRepair();

    expect(repairSignal?.aborted).toBe(false);
    useAiRepairHookForTest('{edited:true}');
    expect(repairSignal?.aborted).toBe(true);

    resolveRun?.();
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
    capturedEffects?.onApplyFixedJson('{"ok":true}', {
      changed: true,
      repairMethod: 'local',
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
    });
    capturedEffects?.onSetMode(TransformMode.FORMAT);
    capturedEffects?.onOpenAiSettings();

    expect(hookInput.onApplyFixedJson).not.toHaveBeenCalled();
    expect(hookInput.onSetMode).not.toHaveBeenCalled();
    expect(hookInput.onOpenAiSettings).not.toHaveBeenCalled();
  });
});
