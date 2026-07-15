import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import type { AiRepairSummary } from '../utils/aiRepairSummary';
import { cleanJsonInput } from '../utils/jsonValidation';
import { isStandaloneDeepFormatInput } from '../utils/transformations';
import { useAppSourceInputCommands } from './useAppSourceInputCommands';

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

vi.mock('../utils/jsonValidation', () => ({
  cleanJsonInput: vi.fn((value: string) => value.trim()),
}));

vi.mock('../utils/transformations', () => ({
  isStandaloneDeepFormatInput: vi.fn(),
}));

const aiSummary: AiRepairSummary = {
  changed: true,
  repairMethod: 'local',
  localRuleLabels: ['补全括号'],
  beforeLength: 4,
  afterLength: 7,
  beforeLines: 1,
  afterLines: 1,
  addedChars: 3,
  removedChars: 0,
  changedChunks: 1,
  rootDescription: '对象',
  previewItems: [],
  isPreviewTruncated: false,
  isDiffSkipped: false,
};

const createHookInput = (overrides: Partial<Parameters<typeof useAppSourceInputCommands>[0]> = {}) => ({
  sourceText: '{"a":1}',
  mode: TransformMode.NONE,
  inputRef: { current: '{"a":1}' },
  onSetSourceText: vi.fn(),
  onSetMode: vi.fn(),
  onSetSmartSuggestionOrigin: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  ...overrides,
});

describe('useAppSourceInputCommands', () => {
  let repairSnapshotRef: { current: string | null };
  let aiSummaryState: AiRepairSummary | null;
  let setAiRepairSummary: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    repairSnapshotRef = { current: null };
    aiSummaryState = null;
    setAiRepairSummary = vi.fn((nextValue: AiRepairSummary | null) => {
      aiSummaryState = nextValue;
    });
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useEffect.mockImplementation((effect: () => void) => effect());
    reactMocks.useRef.mockReturnValue(repairSnapshotRef);
    reactMocks.useState.mockImplementation(() => [aiSummaryState, setAiRepairSummary]);
    vi.mocked(isStandaloneDeepFormatInput).mockReturnValue(false);
  });

  it('清理 SOURCE 输入并同步 ref、活动文件和智能建议状态', () => {
    repairSnapshotRef.current = 'fixed-json';
    vi.mocked(isStandaloneDeepFormatInput).mockReturnValue(true);
    const input = createHookInput();
    const { handleInputChange } = useAppSourceInputCommands(input);

    handleInputChange('  sampleapp://v7/test  ');

    expect(cleanJsonInput).toHaveBeenCalledWith('  sampleapp://v7/test  ');
    expect(input.onSetSmartSuggestionOrigin).toHaveBeenCalledWith(null);
    expect(setAiRepairSummary).toHaveBeenCalledWith(null);
    expect(input.onSetSourceText).toHaveBeenCalledWith('sampleapp://v7/test');
    expect(input.onSetMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(input.inputRef.current).toBe('sampleapp://v7/test');
    expect(input.onUpdateActiveFileContent).toHaveBeenCalledWith('sampleapp://v7/test');
  });

  it('非 NONE 模式下保持当前模式', () => {
    vi.mocked(isStandaloneDeepFormatInput).mockReturnValue(true);
    const input = createHookInput({ mode: TransformMode.FORMAT });
    const { handleInputChange } = useAppSourceInputCommands(input);

    handleInputChange('{"a":1}');

    expect(input.onSetMode).not.toHaveBeenCalled();
  });

  it('应用 AI 修复结果时写入摘要、SOURCE、ref 和活动文件', () => {
    const input = createHookInput();
    const { handleApplyAiRepairResult } = useAppSourceInputCommands(input);

    handleApplyAiRepairResult('{"fixed":true}', aiSummary);

    expect(repairSnapshotRef.current).toBe('{"fixed":true}');
    expect(setAiRepairSummary).toHaveBeenCalledWith(aiSummary);
    expect(input.onSetSourceText).toHaveBeenCalledWith('{"fixed":true}');
    expect(input.inputRef.current).toBe('{"fixed":true}');
    expect(input.onUpdateActiveFileContent).toHaveBeenCalledWith('{"fixed":true}');
  });

  it('关闭 AI 修复摘要时同步清理快照', () => {
    repairSnapshotRef.current = '{"fixed":true}';
    const { handleCloseAiRepairSummary } = useAppSourceInputCommands(createHookInput());

    handleCloseAiRepairSummary();

    expect(repairSnapshotRef.current).toBeNull();
    expect(setAiRepairSummary).toHaveBeenCalledWith(null);
  });

  it('SOURCE 与修复快照不一致时自动清理摘要', () => {
    repairSnapshotRef.current = '{"fixed":true}';
    aiSummaryState = aiSummary;

    useAppSourceInputCommands(createHookInput({ sourceText: '{"edited":true}' }));

    expect(repairSnapshotRef.current).toBeNull();
    expect(setAiRepairSummary).toHaveBeenCalledWith(null);
  });

  it('SOURCE 仍等于修复快照时保留摘要', () => {
    repairSnapshotRef.current = '{"fixed":true}';
    aiSummaryState = aiSummary;

    useAppSourceInputCommands(createHookInput({ sourceText: '{"fixed":true}' }));

    expect(repairSnapshotRef.current).toBe('{"fixed":true}');
    expect(setAiRepairSummary).not.toHaveBeenCalled();
  });
});
