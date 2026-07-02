import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildWorkflow,
} from './transformReportPanelCopyWorkflowTestFixture';
import { qualitySnapshot } from './transformReportPanelCopyWorkflowTestData';

describe('transformReportPanelCopyWorkflow state actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('质量基线保存空筛选时使用全部并支持清除', () => {
    const { effects, workflow } = buildWorkflow({ deferredQuery: '   ' });

    workflow.setQualityBaseline();
    workflow.clearQualityBaseline();

    expect(effects.setQualityBaseline).toHaveBeenNthCalledWith(1, {
      snapshot: qualitySnapshot,
      filter: '全部',
    });
    expect(effects.showStatusSuccess).toHaveBeenNthCalledWith(1, '已设为临时质量基线', { duration: 1600 });
    expect(effects.setQualityBaseline).toHaveBeenNthCalledWith(2, null);
    expect(effects.showStatusSuccess).toHaveBeenNthCalledWith(2, '临时质量基线已清除', { duration: 1600 });
  });

  it('占位符模板打开受模板、pending 和目标面板保护', () => {
    const missingTemplate = buildWorkflow({ placeholderFillTemplateJsonText: '' });
    missingTemplate.workflow.openPlaceholderFillTemplate();

    const pending = buildWorkflow({ isFilterPending: true });
    pending.workflow.openPlaceholderFillTemplate();

    const missingTarget = buildWorkflow({}, { openTemplateFill: undefined });
    missingTarget.workflow.openPlaceholderFillTemplate();

    const ready = buildWorkflow();
    ready.workflow.openPlaceholderFillTemplate();

    expect(missingTemplate.effects.openTemplateFill).not.toHaveBeenCalled();
    expect(pending.effects.openTemplateFill).not.toHaveBeenCalled();
    expect(missingTarget.effects.showStatusSuccess).not.toHaveBeenCalled();
    expect(ready.effects.openTemplateFill).toHaveBeenCalledWith('{"placeholders":{}}');
    expect(ready.effects.showStatusSuccess).toHaveBeenCalledWith('已填入模板填充', { duration: 1600 });
  });
});
