import { describe, expect, it, vi } from 'vitest';
import {
  buildAppAiRepairApplyResult,
  getAppAiRepairErrorFeedback,
  getAppAiRepairSkipMessage,
  getAppAiRepairSuccessMessage,
} from './appAiRepairCommand';
import { AiRepairErrorCode, createAiRepairError } from './aiRepairErrors';

describe('appAiRepairCommand', () => {
  it('识别空 SOURCE 跳过智能修复', () => {
    expect(getAppAiRepairSkipMessage('')).toBe('请先输入需要修复的 JSON 内容');
    expect(getAppAiRepairSkipMessage('   \n')).toBe('请先输入需要修复的 JSON 内容');
    expect(getAppAiRepairSkipMessage('{foo:1}')).toBeNull();
  });

  it('根据修复来源返回成功提示', () => {
    expect(getAppAiRepairSuccessMessage('local')).toBe('本地修复成功');
    expect(getAppAiRepairSuccessMessage('ai')).toBe('AI 修复成功');
  });

  it('将 API Key 错误映射为设置入口提示', () => {
    expect(getAppAiRepairErrorFeedback(
      createAiRepairError(AiRepairErrorCode.ApiKeyRequired, 'API Key 未配置')
    )).toEqual({
      message: '请先配置 AI API Key',
      shouldOpenAiSettings: true,
    });
    expect(getAppAiRepairErrorFeedback(
      createAiRepairError(AiRepairErrorCode.ProviderAuth, 'API Key 无效')
    )).toEqual({
      message: 'API Key 无效',
      shouldOpenAiSettings: true,
    });
    expect(getAppAiRepairErrorFeedback(new Error('网络错误'))).toEqual({
      message: '网络错误',
      shouldOpenAiSettings: false,
    });
    expect(getAppAiRepairErrorFeedback('unknown')).toEqual({
      message: 'AI 修复失败',
      shouldOpenAiSettings: false,
    });
    expect(getAppAiRepairErrorFeedback(new Error('   '))).toEqual({
      message: 'AI 修复失败',
      shouldOpenAiSettings: false,
    });
  });

  it('组装修复应用结果和摘要参数', () => {
    const buildAiRepairSummary = vi.fn(() => ({
      changed: true,
      repairMethod: 'local' as const,
      localRuleLabels: ['修正常见 JS 对象写法'],
      beforeLength: 7,
      afterLength: 8,
      beforeLines: 1,
      afterLines: 1,
      addedChars: 1,
      removedChars: 0,
      changedChunks: 1,
      rootDescription: '对象 1 个键',
      previewItems: [],
      isPreviewTruncated: false,
      isDiffSkipped: false,
    }));

    const result = buildAppAiRepairApplyResult({
      sourceText: '{ok:1}',
      repairResult: {
        fixedJson: '{"ok":1}',
        repairMethod: 'local',
        localRuleLabels: ['修正常见 JS 对象写法'],
      },
      buildAiRepairSummary,
    });

    expect(result.fixedJson).toBe('{"ok":1}');
    expect(result.successMessage).toBe('本地修复成功');
    expect(result.summary.rootDescription).toBe('对象 1 个键');
    expect(buildAiRepairSummary).toHaveBeenCalledWith('{ok:1}', '{"ok":1}', {
      repairMethod: 'local',
      localRuleLabels: ['修正常见 JS 对象写法'],
    });
  });
});
