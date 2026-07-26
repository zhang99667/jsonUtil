import { describe, expect, it } from 'vitest';
import { collectSchemeDisplayHeaderMarkers } from './schemeDisplayHeader';
import { deepParseWithContext, inverseWithContext } from './transformations';

describe('深度解析 URL 来源展示', () => {
  it.each([
    ['HTTP URL', 'http://example.com/path?from=doc'],
    ['HTTPS hash route URL', 'https://example.com/screenshot#/route?tab=preview&from=share'],
    ['URL 编码的 HTTP URL', encodeURIComponent('http://example.com/path?from=doc')],
    ['URL 编码的 HTTPS URL', encodeURIComponent('https://example.com/path?from=doc')],
  ])('%s 没有结构化参数时保持原文', (_scenario, input) => {
    const result = deepParseWithContext(input, { autoExpandScheme: true });

    expect(result.output).toBe(input);
    expect(result.context.sourceFormat).toBeUndefined();
    expect(result.context.records.size).toBe(0);
  });

  it('可展开的 HTTPS hash route 使用 URL 来源标签元数据并可逆', () => {
    const input = `https://example.com/app#/route?cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=hash`;
    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed).toEqual({
      cmd: { nid: 123 },
      from: 'hash',
    });
    expect(result.context.records.get('$')?.steps[0]).toMatchObject({
      schemeHeaderDisplayKey: '__url__',
    });
    expect(collectSchemeDisplayHeaderMarkers(result.context)).toEqual([
      {
        path: '$',
        kind: 'url',
        header: 'https://example.com/app',
        source: input,
      },
    ]);

    parsed.cmd.nid = 456;
    const restored = inverseWithContext(JSON.stringify(parsed), result.context);
    expect(restored).not.toContain('__url__');
    expect(restored).toContain('nid%22%3A456');
  });

  it('URL 来源标签不覆盖真实同名业务字段', () => {
    const input = `http://example.com/app#/route?__url__=${encodeURIComponent('业务参数')}&__url_header__=${encodeURIComponent('备用参数')}&sync_data=${encodeURIComponent(JSON.stringify({ cursor: 1 }))}`;
    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const parsed = JSON.parse(result.output);

    expect(parsed).toMatchObject({
      __url__: '业务参数',
      __url_header__: '备用参数',
      sync_data: { cursor: 1 },
    });
    expect(parsed).not.toHaveProperty('__url_header_2__');
    expect(result.context.records.get('$')?.steps[0]).toMatchObject({
      schemeHeaderDisplayKey: '__url_header_2__',
    });

    const restored = inverseWithContext(result.output, result.context);
    expect(restored).not.toContain('__url_header_2__');
  });

  it('嵌套 Scheme 与 URL 分别生成来源标记', () => {
    const landing = `https://example.com/page?cmd=${encodeURIComponent(JSON.stringify({ id: 1 }))}`;
    const scheme = `sampleapp://v1/open?landing=${encodeURIComponent(landing)}`;
    const result = deepParseWithContext(JSON.stringify({ action_cmd: scheme }), {
      autoExpandScheme: true,
    });

    expect(JSON.parse(result.output).action_cmd).toEqual({
      landing: {
        cmd: { id: 1 },
      },
    });
    expect(collectSchemeDisplayHeaderMarkers(result.context)).toEqual([
      {
        path: '$.action_cmd',
        kind: 'scheme',
        header: 'sampleapp://v1/open',
        source: scheme,
      },
      {
        path: '$.action_cmd.landing',
        kind: 'url',
        header: 'https://example.com/page',
        source: landing,
      },
    ]);
  });
});
