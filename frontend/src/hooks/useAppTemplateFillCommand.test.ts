import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../types';
import { useAppTemplateFillCommand } from './useAppTemplateFillCommand';
import { runAppTemplateFillCommand } from '../utils/appTemplateFillCommandRunner';
import { showError, showSuccess } from '../utils/toast';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useMemo: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useMemo: reactMocks.useMemo,
}));

vi.mock('../utils/appTemplateFillCommandRunner', () => ({
  runAppTemplateFillCommand: vi.fn(),
}));

vi.mock('../utils/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('../utils/transformSummary', () => ({}));

const validValidation: ValidationResult = { isValid: true };
const invalidValidation: ValidationResult = { isValid: false, error: 'bad json' };

const createHookInput = (overrides: Partial<Parameters<typeof useAppTemplateFillCommand>[0]> = {}) => ({
  sourceText: '{"a":1}',
  inputRef: { current: '{"a":1}' },
  autoExpandScheme: true,
  validation: validValidation,
  isTemplatePanelOpen: true,
  onSetSourceText: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  onSetTemplateApplyQualityDelta: vi.fn(),
  ...overrides,
});

describe('useAppTemplateFillCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
  });

  it('暴露模板目标错误', () => {
    expect(useAppTemplateFillCommand(createHookInput({ isTemplatePanelOpen: false })).templateTargetError).toBe('');
    expect(useAppTemplateFillCommand(createHookInput({ validation: invalidValidation })).templateTargetError).toBe('当前 SOURCE JSON 无效: bad json');
  });

  it('应用模板时把当前 SOURCE 快照和模板 effects 传给 runner', async () => {
    const input = createHookInput();
    const { handleApplyTemplate } = useAppTemplateFillCommand(input);

    await handleApplyTemplate('{"b":2}');

    expect(runAppTemplateFillCommand).toHaveBeenCalledWith({
      autoExpandScheme: true,
      sourceBeforeApply: '{"a":1}',
      templateJson: '{"b":2}',
    }, expect.objectContaining({
      onSetSourceText: input.onSetSourceText,
      onUpdateActiveFileContent: input.onUpdateActiveFileContent,
      onSetTemplateApplyQualityDelta: input.onSetTemplateApplyQualityDelta,
      onShowError: showError,
      onShowSuccess: showSuccess,
    }));
  });

  it('runner effects 读写 inputRef，保持 SOURCE 竞态保护入口', async () => {
    const input = createHookInput();
    const { handleApplyTemplate } = useAppTemplateFillCommand(input);

    await handleApplyTemplate('{"b":2}');
    const effects = vi.mocked(runAppTemplateFillCommand).mock.calls[0][1];

    expect(effects.getCurrentSourceText()).toBe('{"a":1}');
    effects.setCurrentSourceText('{"merged":true}');
    expect(input.inputRef.current).toBe('{"merged":true}');
    expect(await effects.loadSummaryModule()).toBeDefined();
  });
});
