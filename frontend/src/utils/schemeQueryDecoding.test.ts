import { describe, expect, it } from 'vitest';
import {
  decodeQueryComponent,
  decodeQueryComponentOrOriginal,
  decodeQueryValueComponent,
  tryDecodeURIComponent,
  urlDecode,
} from './schemeQueryDecoding';

describe('schemeQueryDecoding', () => {
  it('URL Decode 失败时保留原值', () => {
    expect(urlDecode('%GG')).toBe('%GG');
    expect(tryDecodeURIComponent('%GG')).toBeNull();
    expect(tryDecodeURIComponent('%E4%BD%A0%E5%A5%BD')).toBe('你好');
  });

  it('按表单编码把查询参数中的加号还原为空格', () => {
    expect(decodeQueryComponent('json+schema')).toBe('json schema');
    expect(decodeQueryComponent('%GG+schema')).toBe('%GG schema');
    expect(decodeQueryComponentOrOriginal('%GG+schema')).toBe('%GG+schema');
  });

  it('当保留加号后才是可解析结构时保留字面量加号', () => {
    const isDecodableValue = (value: string): boolean => value === 'a+b';
    expect(decodeQueryValueComponent('a+b', isDecodableValue)).toBe('a+b');
  });

  it('普通查询值仍按表单语义解码加号', () => {
    const isDecodableValue = () => false;
    expect(decodeQueryValueComponent('a+b', isDecodableValue)).toBe('a b');
  });
});
