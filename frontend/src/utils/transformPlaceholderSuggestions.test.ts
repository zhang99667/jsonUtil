import { describe, expect, it } from 'vitest';
import {
  buildPlaceholderReplacementSuggestions,
  isSafePlaceholderReplacement,
  normalizeReplacementSourceLabel,
  type TransformPlaceholderSuggestionView,
} from './transformPlaceholderSuggestions';

const buildView = (
  placeholderValues: string[],
  records: TransformPlaceholderSuggestionView['records'],
  isRecordTruncated = false
): TransformPlaceholderSuggestionView => ({
  isRecordTruncated,
  runtimePlaceholderGroups: placeholderValues.map(value => ({ value })),
  records,
});

describe('transformPlaceholderSuggestions', () => {
  it('归一化业务字段名用于跨风格匹配', () => {
    expect(normalizeReplacementSourceLabel('ad_extra-param')).toBe('adextraparam');
    expect(normalizeReplacementSourceLabel('Callback_URL')).toBe('callbackurl');
  });

  it('过滤空值、原占位符和包含占位符的替换值', () => {
    expect(isSafePlaceholderReplacement('', '__SIGN__')).toBe(false);
    expect(isSafePlaceholderReplacement('   ', '__SIGN__')).toBe(false);
    expect(isSafePlaceholderReplacement('__SIGN__', '__SIGN__')).toBe(false);
    expect(isSafePlaceholderReplacement('prefix-__SIGN__', '__SIGN__')).toBe(false);
    expect(isSafePlaceholderReplacement('real-sign', '__SIGN__')).toBe(true);
  });

  it('为强匹配业务字段生成唯一回填建议', () => {
    const suggestions = buildPlaceholderReplacementSuggestions(buildView(
      ['__AD_EXTRA_PARAM_ENCODE_1__'],
      [
        {
          path: '$.extra[0].v',
          sourceLabel: 'extraParam',
          originalValue: 'cmd=%7B%22aid%22%3A%22extra-1%22%7D',
        },
      ]
    ));

    expect(suggestions.get('__AD_EXTRA_PARAM_ENCODE_1__')).toEqual({
      replacement: 'cmd=%7B%22aid%22%3A%22extra-1%22%7D',
      sourcePath: '$.extra[0].v',
      sourceLabel: 'extraParam',
      reason: '业务字段 extraParam 与 __AD_EXTRA_PARAM_ENCODE_1__ 强匹配',
    });
  });

  it('候选值冲突或来源截断时不生成建议', () => {
    const conflictingView = buildView(
      ['__AD_EXTRA_PARAM_ENCODE_1__'],
      [
        { path: '$.extra[0].v', sourceLabel: 'extraParam', originalValue: 'cmd=1' },
        { path: '$.extra[1].v', sourceLabel: 'ad_extra_param', originalValue: 'cmd=2' },
      ]
    );
    expect(buildPlaceholderReplacementSuggestions(conflictingView).size).toBe(0);

    const truncatedView = buildView(
      ['__AD_EXTRA_PARAM_ENCODE_1__'],
      [{ path: '$.extra[0].v', sourceLabel: 'extraParam', originalValue: 'cmd=1' }],
      true
    );
    expect(buildPlaceholderReplacementSuggestions(truncatedView).size).toBe(0);
  });

  it('筛选后的占位符可复用全量记录生成建议', () => {
    const filteredView = buildView(['__CALLBACK_URL__'], []);
    const fullSourceView = buildView(
      ['__CALLBACK_URL__'],
      [{ path: '$.config.callback', sourceLabel: 'callback_url', originalValue: 'baiduboxapp://callback' }]
    );

    expect(buildPlaceholderReplacementSuggestions(filteredView, fullSourceView).get('__CALLBACK_URL__')).toMatchObject({
      replacement: 'baiduboxapp://callback',
      sourcePath: '$.config.callback',
      sourceLabel: 'callback_url',
    });
  });
});
