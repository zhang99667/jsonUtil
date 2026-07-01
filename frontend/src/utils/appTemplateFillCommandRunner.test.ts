import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isPlaceholderFillTemplateJson } from './appWorkflowHelpers';
import { buildAppTemplateFillQualityDelta } from './appTemplateFillQualityDelta';
import { applyTemplate } from './transformations';
import { runAppTemplateFillCommand } from './appTemplateFillCommandRunner';

vi.mock('./transformations', async importOriginal => ({
  ...await importOriginal<typeof import('./transformations')>(),
  applyTemplate: vi.fn(() => '{"merged":true}'),
}));

vi.mock('./appWorkflowHelpers', async importOriginal => ({
  ...await importOriginal<typeof import('./appWorkflowHelpers')>(),
  isPlaceholderFillTemplateJson: vi.fn(() => false),
}));

vi.mock('./appTemplateFillQualityDelta', () => ({
  buildAppTemplateFillQualityDelta: vi.fn(() => '质量变化: +1'),
}));

const createEffectsBase = () => ({
  currentSourceText: '{"a":1}',
  getCurrentSourceText: vi.fn(function getCurrentSourceText(this: { currentSourceText: string }) {
    return this.currentSourceText;
  }),
  setCurrentSourceText: vi.fn(function setCurrentSourceText(this: { currentSourceText: string }, value: string) {
    this.currentSourceText = value;
  }),
  loadSummaryModule: vi.fn(async () => ({}) as never),
  onSetSourceText: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  onSetTemplateApplyQualityDelta: vi.fn(),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
});

const createEffects = (overrides: Partial<ReturnType<typeof createEffectsBase>> = {}) => ({
  ...createEffectsBase(),
  ...overrides,
});

const runTemplate = (effects = createEffects(), templateJson = '{"b":2}') => runAppTemplateFillCommand(
  { sourceBeforeApply: '{"a":1}', templateJson, autoExpandScheme: true },
  effects
);

describe('appTemplateFillCommandRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyTemplate).mockReturnValue('{"merged":true}');
    vi.mocked(buildAppTemplateFillQualityDelta).mockReturnValue('质量变化: +1');
    vi.mocked(isPlaceholderFillTemplateJson).mockReturnValue(false);
  });

  it('应用普通模板时更新 SOURCE 并清空质量 delta', async () => {
    const effects = createEffects();

    await runTemplate(effects);

    expect(effects.loadSummaryModule).not.toHaveBeenCalled();
    expect(buildAppTemplateFillQualityDelta).not.toHaveBeenCalled();
    expect(applyTemplate).toHaveBeenCalledWith('{"a":1}', '{"b":2}');
    expect(effects.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(effects.onSetSourceText).toHaveBeenCalledWith('{"merged":true}');
    expect(effects.currentSourceText).toBe('{"merged":true}');
    expect(effects.onUpdateActiveFileContent).toHaveBeenCalledWith('{"merged":true}');
    expect(effects.onShowSuccess).toHaveBeenCalledWith('模板已应用');
  });

  it('占位符回填模板会生成质量 delta', async () => {
    vi.mocked(isPlaceholderFillTemplateJson).mockReturnValue(true);
    const summaryModule = { marker: 'summary' } as never;
    const effects = createEffects();
    effects.loadSummaryModule.mockResolvedValue(summaryModule);

    await runTemplate(effects, '{"kind":"json-helper-runtime-placeholder-fill-template"}');

    expect(effects.loadSummaryModule).toHaveBeenCalledTimes(1);
    expect(buildAppTemplateFillQualityDelta).toHaveBeenCalledWith(expect.objectContaining({
      sourceBeforeApply: '{"a":1}',
      sourceAfterApply: '{"merged":true}',
      autoExpandScheme: true,
      summaryModule,
    }));
    expect(effects.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('质量变化: +1');
    expect(effects.onShowSuccess).toHaveBeenCalledWith('占位符已回填，质量对比已更新');
  });

  it('占位符回填期间 SOURCE 已变化时阻止应用模板', async () => {
    vi.mocked(isPlaceholderFillTemplateJson).mockReturnValue(true);
    const effects = createEffects();
    effects.loadSummaryModule.mockImplementation(async () => {
      effects.currentSourceText = '{"changed":true}';
      return {} as never;
    });

    await runTemplate(effects, '{"kind":"json-helper-runtime-placeholder-fill-template"}');

    expect(applyTemplate).not.toHaveBeenCalled();
    expect(effects.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(effects.onShowError).toHaveBeenCalledWith('内容已变化，请重新应用模板');
  });

  it('模板应用失败时保留原始错误文案', async () => {
    vi.mocked(applyTemplate).mockImplementation(() => {
      throw new Error('当前编辑器内容为空');
    });
    const effects = createEffects();

    await runTemplate(effects);

    expect(effects.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(effects.onShowError).toHaveBeenCalledWith('当前编辑器内容为空');
  });

  it('非 Error 异常使用失败兜底文案且不写回 SOURCE', async () => {
    vi.mocked(applyTemplate).mockImplementation(() => {
      throw 'blocked';
    });
    const effects = createEffects();

    await runTemplate(effects);

    expect(effects.onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(effects.onSetSourceText).not.toHaveBeenCalled();
    expect(effects.onUpdateActiveFileContent).not.toHaveBeenCalled();
    expect(effects.onShowError).toHaveBeenCalledWith('模板应用失败');
  });
});
