import { describe, expect, it } from 'vitest';
import {
  getApplyPreviewTitle,
  getAutoSaveAriaLabel,
  getAutoSaveTitle,
  getClearSourceTitle,
  getCopyPreviewTitle,
  getCopySourceTitle,
  getSourceAiRepairTitle,
  getTransformReportTitle,
} from './appActionLabels';

describe('appActionLabels', () => {
  it('生成自动保存 title 和 aria label', () => {
    expect(getAutoSaveTitle(false, false, false)).toBe('请先打开文件以启用自动保存');
    expect(getAutoSaveTitle(true, false, false)).toBe('请先保存当前标签以启用自动保存');
    expect(getAutoSaveTitle(true, true, false)).toBe('点击开启自动保存');
    expect(getAutoSaveTitle(true, true, true)).toBe('自动保存已开启');
    expect(getAutoSaveAriaLabel(false, false, '请先打开文件以启用自动保存'))
      .toBe('自动保存不可用，请先打开文件以启用自动保存');
    expect(getAutoSaveAriaLabel(true, true, '自动保存已开启')).toBe('自动保存已开启，点击关闭');
    expect(getAutoSaveAriaLabel(true, false, '点击开启自动保存')).toBe('自动保存已关闭，点击开启');
  });

  it('生成 SOURCE 操作 title', () => {
    expect(getCopySourceTitle(true)).toBe('复制 SOURCE 内容到剪贴板');
    expect(getCopySourceTitle(false)).toBe('SOURCE 为空，暂无内容可复制');
    expect(getClearSourceTitle(true)).toBe('清空 SOURCE 内容');
    expect(getClearSourceTitle(false)).toBe('SOURCE 为空，暂无内容可清空');
    expect(getSourceAiRepairTitle(true)).toBe('智能修复中，请等待当前任务完成');
    expect(getSourceAiRepairTitle(false)).toBe('用智能修复当前 SOURCE JSON 错误');
  });

  it('生成报告与 PREVIEW 操作 title', () => {
    expect(getTransformReportTitle(true, true)).toBe('预览仍在处理，请稍后查看报告');
    expect(getTransformReportTitle(false, false)).toBe('暂无深度解析报告可查看');
    expect(getTransformReportTitle(false, true)).toBe('查看深度解析报告');
    expect(getApplyPreviewTitle(true, true, false)).toBe('预览仍在处理，请稍后应用');
    expect(getApplyPreviewTitle(false, false, false)).toBe('暂无 PREVIEW 内容可应用');
    expect(getApplyPreviewTitle(false, true, true)).toBe('PREVIEW 与 SOURCE 内容一致，无需应用');
    expect(getApplyPreviewTitle(false, true, false)).toBe('用 PREVIEW 内容替换 SOURCE');
    expect(getCopyPreviewTitle(true, true)).toBe('预览仍在处理，请稍后复制');
    expect(getCopyPreviewTitle(false, false)).toBe('暂无 PREVIEW 内容可复制');
    expect(getCopyPreviewTitle(false, true)).toBe('复制预览内容到剪贴板');
  });
});
