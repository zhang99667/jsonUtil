import { describe, expect, it } from 'vitest';
import {
  addSchemeDisplayHeader,
  removeSchemeDisplayHeader,
} from './schemeDisplayHeader';

const SOURCE = 'sampleapp://v7/vendor/ad/immersiveVideo?params=%7B%7D&style=dark';
const HTTP_SOURCE = 'http://example.com/harmony/#/nativePhone?solutionId=2830284';

describe('schemeDisplayHeader', () => {
  it('将根 Scheme 协议头放在展开参数之前', () => {
    const result = addSchemeDisplayHeader({ params: {}, style: 'dark' }, SOURCE);

    expect(result).toEqual({
      headerKey: '__scheme__',
      value: {
        __scheme__: 'sampleapp://v7/vendor/ad/immersiveVideo',
        params: {},
        style: 'dark',
      },
    });
  });

  it('将 HTTP 地址头放在展开参数之前', () => {
    const result = addSchemeDisplayHeader({ solutionId: '2830284' }, HTTP_SOURCE);

    expect(result).toEqual({
      headerKey: '__url__',
      value: {
        __url__: 'http://example.com/harmony/',
        solutionId: '2830284',
      },
    });
  });

  it('真实参数占用默认字段名时使用备用字段名', () => {
    const result = addSchemeDisplayHeader({ __scheme__: '业务参数' }, SOURCE);

    expect(result?.headerKey).toBe('__scheme_header__');
    expect(result?.value).toEqual({
      __scheme_header__: 'sampleapp://v7/vendor/ad/immersiveVideo',
      __scheme__: '业务参数',
    });
  });

  it('真实 URL 参数占用默认字段名时使用备用字段名', () => {
    const result = addSchemeDisplayHeader({ __url__: '业务参数' }, HTTP_SOURCE);

    expect(result).toEqual({
      headerKey: '__url_header__',
      value: {
        __url_header__: 'http://example.com/harmony/',
        __url__: '业务参数',
      },
    });
  });

  it('两个 URL 候选字段均被占用时保持业务数据原样', () => {
    const result = addSchemeDisplayHeader({
      __url__: '业务参数',
      __url_header__: '备用业务参数',
    }, HTTP_SOURCE);

    expect(result).toBeNull();
  });

  it('反向编码时移除展示字段并允许修改协议头', () => {
    const result = removeSchemeDisplayHeader({
      __scheme__: 'sampleapp://v7/vendor/ad/immersiveVideoV2',
      params: { show_time: 9 },
    }, SOURCE, '__scheme__');

    expect(result).toEqual({
      source: 'sampleapp://v7/vendor/ad/immersiveVideoV2?params=%7B%7D&style=dark',
      value: { params: { show_time: 9 } },
    });
  });

  it('非法协议头不会覆盖原 Scheme', () => {
    const result = removeSchemeDisplayHeader({
      __scheme__: 'not-a-scheme',
      params: {},
    }, SOURCE, '__scheme__');

    expect(result.source).toBe(SOURCE);
    expect(result.value).toEqual({ params: {} });
  });
});
