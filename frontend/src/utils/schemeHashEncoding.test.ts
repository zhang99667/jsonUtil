import { describe, expect, it } from 'vitest';
import { replaceHashParams } from './schemeHashEncoding';

describe('schemeHashEncoding', () => {
  it('保留 hash route 前缀并替换参数', () => {
    expect(replaceHashParams('#/detail?cmd=old&from=feed', 'cmd=new&from=panel'))
      .toBe('/detail?cmd=new&from=panel');
  });

  it('hash route 参数被清空时保留 route 路径', () => {
    expect(replaceHashParams('#/detail?cmd=old&from=feed', '')).toBe('/detail');
  });

  it('保留锚点后追加参数的锚点前缀', () => {
    expect(replaceHashParams('#zzzaz1)&unit=%E6%97%A7', 'unit=%E6%96%B0&keyword=schema'))
      .toBe('zzzaz1)&unit=%E6%96%B0&keyword=schema');
  });

  it('空 hash 按 query 片段重建', () => {
    expect(replaceHashParams('', 'cmd=new')).toBe('?cmd=new');
    expect(replaceHashParams('', '')).toBe('');
  });

  it('普通锚点没有参数时追加 query', () => {
    expect(replaceHashParams('#section', 'cmd=new')).toBe('section?cmd=new');
  });

  it('裸 query hash 直接替换为新 query', () => {
    expect(replaceHashParams('#cmd=old&from=feed', 'cmd=new')).toBe('cmd=new');
  });
});
