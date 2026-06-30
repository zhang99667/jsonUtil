import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../types';
import { useAppTemplateFillCommand } from './useAppTemplateFillCommand';
import { showError, showSuccess } from '../utils/toast';
import { applyTemplate } from '../utils/transformations';
import { isPlaceholderFillTemplateJson } from '../utils/appWorkflowHelpers';
import { buildAppTemplateFillQualityDelta } from '../utils/appTemplateFillQualityDelta';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useMemo: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useMemo: reactMocks.useMemo,
}));

vi.mock('../utils/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('../utils/transformations', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/transformations')>(),
  applyTemplate: vi.fn(() => '{"merged":true}'),
}));

vi.mock('../utils/appWorkflowHelpers', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appWorkflowHelpers')>(),
  isPlaceholderFillTemplateJson: vi.fn(() => false),
}));

vi.mock('../utils/appTemplateFillQualityDelta', () => ({
  buildAppTemplateFillQualityDelta: vi.fn(() => '质量变化: +1'),
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
    vi.mocked(applyTemplate).mockReturnValue('{"merged":true}');
    vi.mocked(buildAppTemplateFillQualityDelta).mockReturnValue('质量变化: +1');
    vi.mocked(isPlaceholderFillTemplateJson).mockReturnValue(false);
  });

  it('暴露模板目标错误', () => {
    expect(useAppTemplateFillCommand(createHookInput({ isTemplatePanelOpen: false })).templateTargetError).toBe('');
    expect(useAppTemplateFillCommand(createHookInput({ validation: invalidValidation })).templateTargetError).toBe('当前 SOURCE JSON 无效: bad json');
  });

  it('应用普通模板时更新 SOURCE 并清空质量 delta', async () => {
    const input = createHookInput();
    const { handleApplyTemplate } = useAppTemplateFillCommand(input);

    await handleApplyTemplate('{"b":2}');

    expect(applyTemplate).toHaveBeenCalledWith('{"a":1}', '{"b":2}');
    expect(input.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(input.onSetSourceText).toHaveBeenCalledWith('{"merged":true}');
    expect(input.inputRef.current).toBe('{"merged":true}');
    expect(input.onUpdateActiveFileContent).toHaveBeenCalledWith('{"merged":true}');
    expect(showSuccess).toHaveBeenCalledWith('模板已应用');
  });

  it('占位符回填模板会生成质量 delta', async () => {
    vi.mocked(isPlaceholderFillTemplateJson).mockReturnValue(true);
    const input = createHookInput();
    const { handleApplyTemplate } = useAppTemplateFillCommand(input);

    await handleApplyTemplate('{"kind":"json-helper-runtime-placeholder-fill-template"}');

    expect(buildAppTemplateFillQualityDelta).toHaveBeenCalledTimes(1);
    expect(buildAppTemplateFillQualityDelta).toHaveBeenCalledWith(expect.objectContaining({
      sourceBeforeApply: '{"a":1}',
      sourceAfterApply: '{"merged":true}',
      autoExpandScheme: true,
    }));
    expect(input.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('质量变化: +1');
    expect(showSuccess).toHaveBeenCalledWith('占位符已回填，质量对比已更新');
  });

  it('占位符回填期间 SOURCE 已变化时阻止应用模板', async () => {
    vi.mocked(isPlaceholderFillTemplateJson).mockReturnValue(true);
    const input = createHookInput({ inputRef: { current: '{"changed":true}' } });
    const { handleApplyTemplate } = useAppTemplateFillCommand(input);

    await handleApplyTemplate('{"kind":"json-helper-runtime-placeholder-fill-template"}');

    expect(applyTemplate).not.toHaveBeenCalled();
    expect(input.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(showError).toHaveBeenCalledWith('内容已变化，请重新应用模板');
  });

  it('模板应用失败时保留原始错误文案', async () => {
    vi.mocked(applyTemplate).mockImplementation(() => {
      throw new Error('当前编辑器内容为空');
    });
    const input = createHookInput();
    const { handleApplyTemplate } = useAppTemplateFillCommand(input);

    await handleApplyTemplate('{"b":2}');

    expect(input.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(showError).toHaveBeenCalledWith('当前编辑器内容为空');
    expect(showError).not.toHaveBeenCalledWith('模板应用失败：当前编辑器内容为空');
  });
});
