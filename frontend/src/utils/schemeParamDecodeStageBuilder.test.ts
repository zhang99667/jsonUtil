import { describe, expect, it } from 'vitest';
import { tryParseJson, tryParseJsonWithMeta } from './schemeJsonPayloads';
import {
  createParamDecodeStage,
  formatPlaceholderPathSegment,
  type SchemeParamDecodeStageBuilderOptions,
} from './schemeParamDecodeStageBuilder';

const createOptions = (): SchemeParamDecodeStageBuilderOptions => ({
  decodeNestedValue: (value: string) => tryParseJson(value) ?? value,
  tryParseJsonWithMeta,
  urlEncode: encodeURIComponent,
});

describe('schemeParamDecodeStageBuilder', () => {
  it('构造单条参数分层证据并标记 JSON 修复提示', () => {
    const stage = createParamDecodeStage(
      'cmd-url',
      '%7Bfoo%3A1%2C%7D',
      '{foo:1,}',
      'query',
      '$',
      10,
      createOptions()
    );

    expect(stage).toMatchObject({
      path: '$["cmd-url"]',
      key: 'cmd-url',
      source: 'query',
      parsed: expect.stringContaining('"foo": 1'),
      repairHint: 'Loose JSON 已补齐字段引号/单引号/尾逗号',
      reversible: false,
    });
  });

  it('超长参数只保留预览并标记不可逆', () => {
    const overlongValue = 'x'.repeat(100_001);
    const stage = createParamDecodeStage(
      'payload',
      overlongValue,
      overlongValue,
      'query',
      '$',
      10,
      createOptions()
    );

    expect(stage.parsed).toBe(overlongValue);
    expect(stage.repairHint).toBe('参数过长，已跳过分层 JSON 解析预览');
    expect(stage.reversible).toBe(false);
  });

  it('格式化可读和不可读路径段', () => {
    expect(formatPlaceholderPathSegment('params')).toBe('.params');
    expect(formatPlaceholderPathSegment('cmd-url')).toBe('["cmd-url"]');
  });
});
