import { describe, expect, it } from 'vitest';
import { APP_VERSION_METADATA } from './appVersion';
import {
  ARCHIVE_OMITTED_ORIGINAL_VALUE,
  sanitizeTransformIssueSampleExportForArchive,
  sanitizeTransformPlaceholderFillTemplateForArchive,
} from './transformArchiveSanitizers';
import type {
  TransformIssueSampleExport,
  TransformPlaceholderFillTemplate,
} from './transformSummary';

describe('transformArchiveSanitizers', () => {
  it('归档问题样本时保留已脱敏样本并省略未脱敏原文', () => {
    const sampleExport: TransformIssueSampleExport = {
      schemaVersion: 1,
      kind: 'json-helper-transform-issue-samples',
      tool: APP_VERSION_METADATA,
      filter: '全部',
      suggestedCommands: [],
      summary: {
        unresolved: { copied: 1, filtered: 1, total: 1, truncated: false },
        runtimePlaceholders: { copied: 0, filtered: 0, total: 0, truncated: false },
        warnings: { copied: 1, filtered: 1, total: 1, truncated: false },
      },
      samples: [
        {
          type: 'unresolved',
          path: '$.safe',
          originalValue: '[脱敏 token]',
          redactionHint: '已脱敏 token',
          reasonLabel: '待检查',
        },
        {
          type: 'warning',
          path: '$.secret',
          originalValue: 'raw-secret-token',
          reasonLabel: '跳过',
        },
      ],
    };

    const archived = sanitizeTransformIssueSampleExportForArchive(sampleExport);

    expect(archived?.samples[0].originalValue).toBe('[脱敏 token]');
    expect(archived?.samples[1].originalValue).toBe(ARCHIVE_OMITTED_ORIGINAL_VALUE);
    expect(archived?.samples[1].redactionHint).toBe('归档包默认省略原始值，沉淀 corpus 前请从已脱敏 response 补齐');
  });

  it('归档占位符回填模板时清空候选值和来源预览', () => {
    const template: TransformPlaceholderFillTemplate = {
      schemaVersion: 1,
      kind: 'json-helper-runtime-placeholder-fill-template',
      tool: APP_VERSION_METADATA,
      filter: '全部',
      summary: {
        groups: 1,
        visibleOccurrences: 1,
        filteredOccurrences: 1,
        totalOccurrences: 1,
        truncated: false,
      },
      placeholders: {
        __SIGN__: 'real-sign',
      },
      placeholderDetails: [
        {
          value: '__SIGN__',
          replacement: 'real-sign',
          suggestion: {
            replacement: 'real-sign',
            sourcePath: '$.sign',
            reason: '业务字段 sign 与 __SIGN__ 强匹配',
          },
          description: '签名占位符',
          count: 1,
          sourceCount: 1,
          sources: [
            {
              sourcePath: '$.payload.sign',
              sourceLabel: 'sign',
              count: 1,
              sourceOriginalPreview: 'real-sign',
            },
          ],
        },
      ],
    };

    const archived = sanitizeTransformPlaceholderFillTemplateForArchive(template);

    expect(archived?.placeholders.__SIGN__).toBe('');
    expect(archived?.placeholderDetails[0]).toEqual({
      value: '__SIGN__',
      replacement: '',
      description: '签名占位符',
      count: 1,
      sourceCount: 1,
      sources: [
        {
          sourcePath: '$.payload.sign',
          sourceLabel: 'sign',
          count: 1,
        },
      ],
    });
    expect(JSON.stringify(archived)).not.toContain('real-sign');
    expect(JSON.stringify(archived)).not.toContain('suggestion');
    expect(JSON.stringify(archived)).not.toContain('sourceOriginalPreview');
  });
});
