import { describe, expect, it } from 'vitest';
import type { Base64MetaInfo } from './schemeMetadata';
import { buildSchemeViewerBase64MetaBadges } from './schemeViewerBase64MetaBadges';

const buildMetaInfo = (overrides: Partial<Base64MetaInfo> = {}): Base64MetaInfo => ({
  prefix: 'AFD',
  suffix: 'x'.repeat(40),
  suffixDecodePrefix: 'skip-prefix',
  suffixLength: 40,
  suffixDecodedCount: 8,
  suffixDecodedEntries: [
    { key: 'prefix', displayValue: 'conflict' },
    { key: 'os', displayValue: '2' },
    { key: 'ip', displayValue: '127.0.0.1' },
    { key: 'a', displayValue: '1' },
    { key: 'b', displayValue: '2' },
    { key: 'c', displayValue: '3' },
    { key: 'hidden', displayValue: 'not shown' },
  ],
  ...overrides,
});

describe('schemeViewerBase64MetaBadges', () => {
  it('构建 Base64 元信息 badge 顺序、截断和剩余数量', () => {
    const model = buildSchemeViewerBase64MetaBadges(buildMetaInfo());

    expect(model.badges.map(badge => badge.label)).toEqual([
      '头部=AFD',
      `后缀=${'x'.repeat(32)}...`,
      '跳过=skip-prefix',
      'prefix=conflict',
      'os=2',
      'ip=127.0.0.1',
      'a=1',
      'b=2',
      'c=3',
    ]);
    expect(model.remainingEntryCount).toBe(2);
    expect(model.suffixLengthLabel).toBe('40 字符');
  });

  it('为解码字段 key 加命名空间并区分普通和参数 badge 样式', () => {
    const model = buildSchemeViewerBase64MetaBadges(buildMetaInfo());

    expect(model.badges.map(badge => badge.key)).toEqual([
      'prefix',
      'suffix',
      'suffixDecodePrefix',
      'entry:prefix',
      'entry:os',
      'entry:ip',
      'entry:a',
      'entry:b',
      'entry:c',
    ]);
    expect(model.badges[0].className).toContain('text-gray-300');
    expect(model.badges[3].className).toContain('text-emerald-300');
    expect(model.badges[3].title).toBe('prefix=conflict');
  });

  it('没有后缀时不展示后缀长度', () => {
    const model = buildSchemeViewerBase64MetaBadges(buildMetaInfo({
      suffix: '',
      suffixLength: 0,
      suffixDecodedCount: 1,
      suffixDecodedEntries: [{ key: 'os', displayValue: '2' }],
    }));

    expect(model.suffixLengthLabel).toBeUndefined();
  });
});
