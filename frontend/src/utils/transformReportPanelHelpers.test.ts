import { describe, expect, it } from 'vitest';
import {
  buildPlaceholderFillSummary,
  formatCopySizeLabel,
  formatCopySuccessMessage,
  formatPathValueCopyCountLabel,
  formatPlaceholderFillTitle,
  getDecodedPathSchemeInput,
  getPlaceholderFillTemplateTitle,
  getReportCopyTitle,
} from './transformReportPanelHelpers';
import type { TransformPlaceholderFillTemplate } from './transformSummary';

describe('transformReportPanelHelpers', () => {
  it('格式化复制大小和成功提示', () => {
    expect(formatCopySizeLabel('abc')).toBe('3 字符 / 3 B');
    expect(formatCopySuccessMessage('解析报告', 'abc')).toBe('已复制解析报告（3 字符 / 3 B）');
  });

  it('格式化路径值复制数量', () => {
    expect(formatPathValueCopyCountLabel(3, false)).toBe('3 项');
    expect(formatPathValueCopyCountLabel(3, true)).toBe('已返回 3 项');
  });

  it('把内部字段值转换为可打开 Scheme 的输入', () => {
    expect(getDecodedPathSchemeInput({
      path: '$.cmd',
      preview: 'baiduboxapp://v1/open',
      value: 'baiduboxapp://v1/open',
    })).toBe('baiduboxapp://v1/open');
    expect(getDecodedPathSchemeInput({
      path: '$.cmd',
      preview: '对象: a',
      value: { a: 1 },
    })).toBe('{\n  "a": 1\n}');
    expect(getDecodedPathSchemeInput({
      path: '$.cmd',
      preview: '无值',
    })).toBe('');
  });

  it('汇总占位符回填进度并格式化标题', () => {
    const template: TransformPlaceholderFillTemplate = {
      schemaVersion: 1,
      kind: 'json-helper-runtime-placeholder-fill-template',
      tool: {
        name: 'JSONUtils',
        version: '1.8.254',
        versionLabel: 'v1.8.254',
      },
      filter: '全部',
      summary: {
        groups: 3,
        visibleOccurrences: 3,
        filteredOccurrences: 3,
        totalOccurrences: 3,
        truncated: false,
      },
      placeholders: {
        __A__: 'a',
        __B__: '',
        __C__: '',
      },
      placeholderDetails: [
        {
          value: '__A__',
          replacement: 'a',
          description: '运行时占位符',
          count: 1,
          sourceCount: 1,
          sources: [],
        },
        {
          value: '__B__',
          replacement: '',
          description: '运行时占位符',
          count: 1,
          sourceCount: 1,
          sources: [],
          suggestion: {
            replacement: 'b',
            sourcePath: '$.b',
            reason: '同名字段',
          },
        },
        {
          value: '__C__',
          replacement: '',
          description: '运行时占位符',
          count: 1,
          sourceCount: 1,
          sources: [],
        },
      ],
    };

    const summary = buildPlaceholderFillSummary(template);
    expect(summary).toEqual({
      total: 3,
      filled: 1,
      suggested: 1,
      pending: 2,
    });
    expect(formatPlaceholderFillTitle('打开模板回填', summary)).toBe('打开模板回填（已预填 1/3，候选 1，待补 2）');
    expect(formatPlaceholderFillTitle('打开模板回填', null)).toBe('打开模板回填');
    expect(getPlaceholderFillTemplateTitle('打开模板回填', true, summary, false))
      .toBe('打开模板回填（已预填 1/3，候选 1，待补 2）');
    expect(getPlaceholderFillTemplateTitle('打开模板回填', false, summary, false))
      .toBe('当前筛选没有可用的运行时占位符回填模板');
    expect(getPlaceholderFillTemplateTitle('打开模板回填', true, summary, true))
      .toBe('筛选结果仍在更新，请稍后操作占位符回填模板');
  });

  it('格式化报告复制按钮标题', () => {
    expect(getReportCopyTitle(true, true, false, '复制报告', '暂无内容')).toBe('复制报告');
    expect(getReportCopyTitle(false, true, false, '复制报告', '暂无内容')).toBe('暂无内容');
    expect(getReportCopyTitle(true, false, false, '复制报告', '暂无内容')).toBe('暂无深度解析报告可复制');
    expect(getReportCopyTitle(true, true, true, '复制报告', '暂无内容')).toBe('筛选结果仍在更新，请稍后复制');
  });
});
