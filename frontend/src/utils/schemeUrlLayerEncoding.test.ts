import { describe, expect, it } from 'vitest';
import { getFragmentParamSource } from './schemeFragmentParams';
import { encodeUrlLayerContent } from './schemeUrlLayerEncoding';

const encodeOptions = {
  getFragmentParamSource: (hash: string) => getFragmentParamSource(hash, value => value),
};

describe('schemeUrlLayerEncoding', () => {
  it('同时回写 URL query 与 hash route 参数', () => {
    const edited = JSON.stringify({
      from: 'card',
      _hash: {
        cmd: { a: 4 },
        tab: 'new',
      },
    });

    expect(encodeUrlLayerContent(edited, 'https://example.com/page?from=feed#/detail?cmd=%7B%22a%22%3A1%7D&tab=old', encodeOptions))
      .toBe('https://example.com/page?from=card#/detail?cmd=%7B%22a%22%3A4%7D&tab=new');
  });

  it('只存在 hash 参数时保留锚点前缀', () => {
    const edited = JSON.stringify({
      unit: '新',
      keyword: 'schema',
    });

    expect(encodeUrlLayerContent(edited, 'https://example.com/page#zzzaz1)&unit=%E6%97%A7', encodeOptions))
      .toBe('https://example.com/page#zzzaz1)&unit=%E6%96%B0&keyword=schema');
  });

  it('非 JSON 对象内容保持原样', () => {
    expect(encodeUrlLayerContent('not json', 'https://example.com/page?from=feed', encodeOptions))
      .toBe('not json');
  });
});
