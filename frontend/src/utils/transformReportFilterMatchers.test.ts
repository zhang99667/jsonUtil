import { describe, expect, it } from 'vitest';
import {
  matchesCommandSchemaRow,
  matchesDecodedPath,
  matchesNestedCommandField,
  matchesResourceType,
  shouldSearchLongSourceValue,
} from './transformReportFilterMatchers';

const getCommandSchemaOrigin = (schema: string): string => {
  const match = schema.match(/^([A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#]+)/);
  return match ? match[1] : schema;
};

describe('transformReportFilterMatchers', () => {
  it('匹配资源类型 token 和 decoded 路径', () => {
    expect(matchesResourceType('video', '资源类型:视频')).toBe(true);
    expect(matchesDecodedPath({
      path: '$.payload.media',
      preview: 'https://cdn.baidu.com/a.mp4',
      resourceType: 'video',
    }, '资源类型:视频')).toBe(true);
  });

  it('内部 CMD 字段不使用对象和数组摘要误命中', () => {
    expect(matchesNestedCommandField({ path: '$.cmd.obj', preview: '对象: url, nid' }, 'url')).toBe(false);
    expect(matchesNestedCommandField({ path: '$.cmd.url', preview: '对象: url, nid' }, 'url')).toBe(true);
  });

  it('CMD Schema 行支持 origin 匹配', () => {
    expect(matchesCommandSchemaRow({
      path: '$.cmd.primary',
      schema: 'baiduboxapp://v1/open?url=https%3A%2F%2Fm.baidu.com',
    }, 'baiduboxapp://v1', getCommandSchemaOrigin)).toBe(true);
  });

  it('短字段名不扫描整段原始 CMD，明显 URL/编码片段允许兜底', () => {
    expect(shouldSearchLongSourceValue('url')).toBe(false);
    expect(shouldSearchLongSourceValue('https://m.baidu.com')).toBe(true);
    expect(shouldSearchLongSourceValue('%7B%22cmd')).toBe(true);
  });
});
