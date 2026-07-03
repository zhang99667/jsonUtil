import { describe, expect, it, vi } from 'vitest';
import { createAppTemplateFillCommandEffects } from './appTemplateFillCommandEffects';
import { showError, showSuccess } from './toast';

const toastMocks = vi.hoisted(() => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const summaryModuleMock = vi.hoisted(() => ({
  buildTransformContextReport: vi.fn(),
  buildTransformQualitySnapshot: vi.fn(),
  buildTransformReportView: vi.fn(),
  formatTransformQualitySnapshotDeltaText: vi.fn(),
}));

vi.mock('./toast', () => toastMocks);
vi.mock('./transformSummary', () => summaryModuleMock);

describe('appTemplateFillCommandEffects', () => {
  it('创建模板填充 runner 所需的环境 effects', async () => {
    const inputRef = { current: '{"a":1}' };
    const onSetSourceText = vi.fn();
    const onUpdateActiveFileContent = vi.fn();
    const onSetTemplateApplyQualityDelta = vi.fn();

    const effects = createAppTemplateFillCommandEffects({
      inputRef,
      onSetSourceText,
      onUpdateActiveFileContent,
      onSetTemplateApplyQualityDelta,
    });

    expect(effects.getCurrentSourceText()).toBe('{"a":1}');
    effects.setCurrentSourceText('{"merged":true}');
    expect(inputRef.current).toBe('{"merged":true}');

    effects.onSetSourceText('{"next":true}');
    effects.onUpdateActiveFileContent('{"file":true}');
    effects.onSetTemplateApplyQualityDelta('质量变化');

    expect(onSetSourceText).toHaveBeenCalledWith('{"next":true}');
    expect(onUpdateActiveFileContent).toHaveBeenCalledWith('{"file":true}');
    expect(onSetTemplateApplyQualityDelta).toHaveBeenCalledWith('质量变化');
    expect(effects.onShowError).toBe(showError);
    expect(effects.onShowSuccess).toBe(showSuccess);
    await expect(effects.loadSummaryModule()).resolves.toMatchObject(summaryModuleMock);
  });
});
