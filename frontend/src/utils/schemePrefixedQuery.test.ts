import { describe, expect, it } from 'vitest';
import { findSchemePrefixedQueryString } from './schemePrefixedQuery';

describe('schemePrefixedQuery', () => {
  it('提取带日志前缀的 CMD 参数串', () => {
    expect(findSchemePrefixedQueryString('I/NadRender: cmd=%7B%22nid%22%3A123%7D&from=log')).toEqual({
      prefix: 'I/NadRender: ',
      queryString: 'cmd=%7B%22nid%22%3A123%7D&from=log',
    });
  });

  it('保留箭头前缀和问号前缀', () => {
    expect(findSchemePrefixedQueryString('CMD => ?scheme=baiduboxapp://v1/open?from=log')).toEqual({
      prefix: 'CMD => ',
      queryString: '?scheme=baiduboxapp://v1/open?from=log',
    });
  });

  it('不把普通 query 或多行文本识别为前缀 query', () => {
    expect(findSchemePrefixedQueryString('cmd=%7B%22nid%22%3A123%7D&from=log')).toBeNull();
    expect(findSchemePrefixedQueryString('I/NadRender:\ncmd=%7B%22nid%22%3A123%7D')).toBeNull();
  });
});
