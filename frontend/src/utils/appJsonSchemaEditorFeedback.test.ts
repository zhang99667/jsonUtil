import { describe, expect, it } from 'vitest';
import { buildAppJsonSchemaEditorFeedback } from './appJsonSchemaEditorFeedback';
import type { JsonSchemaValidationResult } from './jsonSchemaValidation';

const createResult = (
  overrides: Partial<JsonSchemaValidationResult> = {},
): JsonSchemaValidationResult => ({
  status: 'invalid',
  isValid: false,
  summary: 'Schema 未通过',
  issues: [{
    path: '$.name',
    pointer: '/name',
    keyword: 'type',
    message: 'must be string',
    schemaPath: '#/properties/name/type',
    suggestion: '将该路径调整为 string 类型，或放宽 Schema type 约束。',
  }],
  issueCount: 1,
  shownIssueCount: 1,
  issueKeywordGroups: [{ key: 'type', count: 1 }],
  issuePathList: ['$.name'],
  ...overrides,
});

describe('appJsonSchemaEditorFeedback', () => {
  it('invalid schema 结果生成编辑器诊断和顶部 warning', () => {
    const feedback = buildAppJsonSchemaEditorFeedback('{\n  "name": 1\n}', createResult());

    expect(feedback.warning).toBe('Schema 未通过 1 个问题');
    expect(feedback.diagnosticHighlights).toHaveLength(1);
    expect(feedback.diagnosticHighlights[0]).toMatchObject({
      path: '$.name',
      keyword: 'type',
      message: 'must be string',
      range: {
        startLine: 2,
        endLine: 2,
      },
    });
  });

  it('非 invalid 或空结果清空编辑器诊断和 warning', () => {
    expect(buildAppJsonSchemaEditorFeedback('{"name":1}', null)).toEqual({
      diagnosticHighlights: [],
      warning: '',
    });
    expect(buildAppJsonSchemaEditorFeedback('{"name":1}', createResult({
      status: 'valid',
      isValid: true,
      issues: [],
      issueCount: 0,
      shownIssueCount: 0,
      issueKeywordGroups: [],
      issuePathList: [],
    }))).toEqual({
      diagnosticHighlights: [],
      warning: '',
    });
  });

  it('SOURCE 不是可定位 JSON 时保留 invalid warning 但不产生诊断高亮', () => {
    const feedback = buildAppJsonSchemaEditorFeedback('{"name":', createResult({
      issueCount: 2,
    }));

    expect(feedback.warning).toBe('Schema 未通过 2 个问题');
    expect(feedback.diagnosticHighlights).toEqual([]);
  });
});
