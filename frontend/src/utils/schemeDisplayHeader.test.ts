import { describe, expect, it } from 'vitest';
import {
  addSchemeDisplayHeader,
  getSchemeDisplayHeader,
  getSchemeDisplayHeaderKey,
  isSchemeDisplayHeaderKey,
  removeSchemeDisplayHeader,
} from './schemeDisplayHeader';
import {
  addSchemeDisplayProjectionHeader,
  buildSchemeDisplayProjection,
  createSchemeDecodeDisplayContext,
} from './schemeDisplayProjection';
import { isSchemeDisplayHeaderRecord } from './transformSchemeDisplayHeaderValidation';

const SOURCE = 'sampleapp://v7/vendor/ad/immersiveVideo?params=%7B%7D&style=dark';
const HTTP_SOURCE = 'http://example.com/harmony/#/nativePhone?solutionId=2830284';

describe('schemeDisplayHeader', () => {
  it('将根 Scheme 协议头放在展开参数之前', () => {
    const context = createSchemeDecodeDisplayContext();
    const value = addSchemeDisplayProjectionHeader(
      { params: {}, style: 'dark' },
      SOURCE,
      [],
      context,
    );
    const projection = buildSchemeDisplayProjection(JSON.stringify(value), context);

    expect(projection?.headers).toEqual([expect.objectContaining({
      headerKey: '__scheme__',
      header: 'sampleapp://v7/vendor/ad/immersiveVideo',
    })]);
    expect(JSON.parse(projection?.displayDecoded ?? 'null')).toEqual({
      __scheme__: 'sampleapp://v7/vendor/ad/immersiveVideo',
      params: {},
      style: 'dark',
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
    expect(getSchemeDisplayHeaderKey(
      { __scheme__: '业务参数' },
      undefined,
    )).toBe('__scheme_header__');
  });

  it('展示字段名被真实参数占用时继续递增', () => {
    expect(getSchemeDisplayHeaderKey({
      __scheme__: '业务参数一',
      __scheme_header__: '业务参数二',
      __scheme_header_2__: '业务参数三',
    }, undefined)).toBe('__scheme_header_3__');
  });

  it('相同协议头事件使用组内唯一展示字段名', () => {
    expect(getSchemeDisplayHeaderKey(
      { id: 3 },
      new Set(['__scheme_header__']),
    )).toBe('__scheme_header_2__');
  });

  it('HTTP 和 HTTPS 地址展开后保留协议头与资源路径', () => {
    expect(getSchemeDisplayHeader('http://example.com/page?from=feed')).toBe(
      'http://example.com/page',
    );
    expect(getSchemeDisplayHeader('https://example.com/page?from=feed')).toBe(
      'https://example.com/page',
    );
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
    for (const invalidHeader of ['not-a-scheme', 'sampleapp://[']) {
      const result = removeSchemeDisplayHeader({
        __scheme__: invalidHeader,
        params: {},
      }, SOURCE, '__scheme__');

      expect(result.source).toBe(SOURCE);
      expect(result.value).toEqual({ params: {} });
    }
  });

  it('展示字段校验仅接受受限命名', () => {
    for (const key of [
      '__url__',
      '__url_header__',
      '__url_header_2__',
      '__url_header_12__',
      '__scheme__',
      '__scheme_header__',
      '__scheme_header_2__',
      '__scheme_header_12__',
    ]) {
      expect(isSchemeDisplayHeaderKey(key)).toBe(true);
      expect(isSchemeDisplayHeaderRecord({
        path: '',
        headerKey: key,
        header: 'sampleapp://v1/item/open',
        source: 'sampleapp://v1/item/open?id=1',
        layers: [],
      })).toBe(true);
    }

    for (const key of [
      '__url_header_0__',
      '__url_header_1__',
      '__url_header_01__',
      '__url_header_any__',
      '__scheme_header_0__',
      '__scheme_header_1__',
      '__scheme_header_01__',
      '__scheme_header_-1__',
      '__scheme_header_any__',
      '__scheme_other__',
      'scheme_header_2',
    ]) {
      expect(isSchemeDisplayHeaderKey(key)).toBe(false);
      expect(isSchemeDisplayHeaderRecord({
        path: '',
        headerKey: key,
        header: 'sampleapp://v1/item/open',
        source: 'sampleapp://v1/item/open?id=1',
        layers: [],
      })).toBe(false);
    }
  });

});
