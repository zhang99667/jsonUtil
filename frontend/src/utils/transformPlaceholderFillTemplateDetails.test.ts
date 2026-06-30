import { describe, expect, it } from 'vitest';
import { buildTransformPlaceholderFillTemplateDetails } from './transformPlaceholderFillTemplateDetails';
import type { PlaceholderReplacementSuggestion } from './transformPlaceholderSuggestions';
import type { TransformReportRuntimePlaceholderGroup } from './transformRuntimePlaceholderTypes';

const createDetailsView = (): { runtimePlaceholderGroups: TransformReportRuntimePlaceholderGroup[] } => ({
  runtimePlaceholderGroups: [
    {
      value: '__A__',
      description: 'A 占位符',
      count: 2,
      sourceCount: 2,
      sources: [
        {
          sourcePath: '$.extra[0].value',
          sourceLabel: 'extraParam',
          count: 1,
          sourceOriginalValue: 'cmd={"secret":"raw"}',
          sourceOriginalPreview: 'cmd=%7B%7D',
        },
        {
          sourcePath: '$.extra[1].value',
          count: 1,
        },
      ],
    },
    {
      value: '__B__',
      description: 'B 占位符',
      count: 1,
      sourceCount: 1,
      sources: [{ sourcePath: '$.action_cmd', count: 1 }],
    },
  ],
});

describe('transformPlaceholderFillTemplateDetails', () => {
  it('按占位符组构建回填明细并保留可选 suggestion 和 source 字段', () => {
    const suggestion: PlaceholderReplacementSuggestion = {
      replacement: 'cmd=%7B%22aid%22%3A1%7D',
      sourcePath: '$.extra[0].value',
      sourceLabel: 'extraParam',
      reason: '业务字段 extraParam 与 __A__ 强匹配',
    };

    const details = buildTransformPlaceholderFillTemplateDetails(
      createDetailsView(),
      new Map([['__A__', suggestion]]),
    );

    expect(details).toEqual([
      {
        value: '__A__',
        replacement: suggestion.replacement,
        suggestion,
        description: 'A 占位符',
        count: 2,
        sourceCount: 2,
        sources: [
          {
            sourcePath: '$.extra[0].value',
            sourceLabel: 'extraParam',
            count: 1,
            sourceOriginalPreview: 'cmd=%7B%7D',
          },
          {
            sourcePath: '$.extra[1].value',
            count: 1,
          },
        ],
      },
      {
        value: '__B__',
        replacement: '',
        description: 'B 占位符',
        count: 1,
        sourceCount: 1,
        sources: [{ sourcePath: '$.action_cmd', count: 1 }],
      },
    ]);
    expect(JSON.stringify(details)).not.toContain('sourceOriginalValue');
  });
});
