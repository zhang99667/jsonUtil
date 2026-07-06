import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildWorkflow,
} from './transformReportPanelCopyWorkflowTestFixture';
import type { TransformReportPanelTemplateCopyWorkflow } from './transformReportPanelCopyWorkflowTypes';

const templateCopyActionCases: Array<{
  actionName: keyof Omit<TransformReportPanelTemplateCopyWorkflow, 'copyPlaceholderReport' | 'openPlaceholderFillTemplate'>;
  text: string;
  successMessage: string;
  errorLogMessage: string;
}> = [
  {
    actionName: 'copyPlaceholderFillTemplate',
    text: '{"placeholders":{}}',
    successMessage: '已复制占位符回填模板',
    errorLogMessage: '复制深度解析占位符回填模板失败:',
  },
  {
    actionName: 'copyIssueSamples',
    text: 'issue-sample-copy-text',
    successMessage: '已复制问题样本',
    errorLogMessage: '复制深度解析问题样本失败:',
  },
  {
    actionName: 'copyIssueSampleJson',
    text: 'issue-json-copy-text',
    successMessage: '已复制样本 JSON',
    errorLogMessage: '复制深度解析样本 JSON 失败:',
  },
  {
    actionName: 'copyRedactedIssueSampleJson',
    text: 'redacted-json-copy-text',
    successMessage: '已复制脱敏样本 JSON',
    errorLogMessage: '复制深度解析脱敏样本 JSON 失败:',
  },
  {
    actionName: 'copyIssueRegressionTemplate',
    text: 'regression-template-copy-text',
    successMessage: '已复制回归模板',
    errorLogMessage: '复制深度解析回归模板失败:',
  },
];

describe('transformReportPanelCopyWorkflow template actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('模板复制动作保留文本、成功文案和错误日志', async () => {
    for (const { actionName, text, successMessage, errorLogMessage } of templateCopyActionCases) {
      const failure = new Error(actionName);
      const success = buildWorkflow();
      await success.workflow[actionName]();

      expect(success.effects.copyText).toHaveBeenCalledWith(text);
      expect(success.effects.showSuccess).toHaveBeenCalledWith(successMessage, { duration: 2000 });

      const failed = buildWorkflow({}, { copyText: vi.fn(async () => { throw failure; }) });
      await failed.workflow[actionName]();

      expect(failed.effects.showError).toHaveBeenCalledWith(errorLogMessage, failure);
    }
  });

  it('筛选结果仍在更新时跳过模板复制动作', async () => {
    for (const { actionName } of templateCopyActionCases) {
      const { effects, workflow } = buildWorkflow({ isFilterPending: true });
      await workflow[actionName]();

      expect(effects.copyText).not.toHaveBeenCalled();
      expect(effects.showSuccess).not.toHaveBeenCalled();
    }
  });
});
