import { describe, expect, it } from 'vitest';
import {
  deepDecodeScheme,
  encodeWithLayersResult,
} from './schemeUtils';

describe('Scheme 协议头展示集成', () => {
  it('整段 CMD 映射中的同级和深层业务 Scheme 分别显示协议头并可回写', () => {
    const landingPage = [
      'https://m.example.com/page?fid=feed-token',
      'ch=3',
      'bd_vid=video-1',
      'bd_vid=video-2',
      'newEb=1',
      'isc=1',
    ].join('&');
    const nestedCommand = 'sampledetail://v2/item/open?id=7';
    const nestedLandingPage = [
      'https://m.example.com/page?fid=detail-token',
      `next=${encodeURIComponent(nestedCommand)}`,
    ].join('&');
    const defaultCommand = `sampleapp:///v1/browser/open?url=${encodeURIComponent(landingPage)}`;
    const mappedCommand = `sampleapp:///v1/browser/open?url=${encodeURIComponent(nestedLandingPage)}`;
    const source = JSON.stringify({
      area_cmd: {
        pop_button: '__CMD_1__',
      },
      cmd_map: {
        default: defaultCommand,
        __CMD_1__: mappedCommand,
      },
    });

    const result = deepDecodeScheme(source);
    const businessValue = JSON.parse(result.decoded);
    const displayValue = JSON.parse(result.displayDecoded || result.decoded);
    const getHeader = (path: string) => {
      const header = result.displayHeaders?.find(item => item.path === path);
      expect(header).toBeDefined();
      return header!;
    };
    const defaultHeader = getHeader('/cmd_map/default');
    const defaultUrlHeader = getHeader('/cmd_map/default/url');
    const mappedHeader = getHeader('/cmd_map/__CMD_1__');
    const mappedUrlHeader = getHeader('/cmd_map/__CMD_1__/url');
    const nestedHeader = getHeader('/cmd_map/__CMD_1__/url/next');

    expect(businessValue.cmd_map.default).toEqual({
      url: {
        fid: 'feed-token',
        ch: '3',
        bd_vid: ['video-1', 'video-2'],
        newEb: '1',
        isc: '1',
      },
    });
    for (const header of result.displayHeaders ?? []) {
      expect(result.decoded).not.toContain(`"${header.headerKey}"`);
    }
    expect(result.decoded).not.toContain('__scheme_display_event_');
    expect(result.displayDecoded).not.toContain('__scheme_display_event_');
    expect(displayValue.cmd_map.default[defaultHeader.headerKey]).toBe(
      'sampleapp:///v1/browser/open',
    );
    expect(displayValue.cmd_map.default.url[defaultUrlHeader.headerKey]).toBe(
      'https://m.example.com/page',
    );
    expect(displayValue.cmd_map.__CMD_1__[mappedHeader.headerKey]).toBe(
      'sampleapp:///v1/browser/open',
    );
    expect(displayValue.cmd_map.__CMD_1__.url[mappedUrlHeader.headerKey]).toBe(
      'https://m.example.com/page',
    );
    expect(displayValue.cmd_map.__CMD_1__.url.next[nestedHeader.headerKey]).toBe(
      'sampledetail://v2/item/open',
    );
    expect(result.displayHeaders?.map(header => header.path)).toEqual([
      '/cmd_map/default',
      '/cmd_map/default/url',
      '/cmd_map/__CMD_1__',
      '/cmd_map/__CMD_1__/url',
      '/cmd_map/__CMD_1__/url/next',
    ]);

    displayValue.cmd_map.__CMD_1__.url.next[nestedHeader.headerKey] = 'sampledetail://v3/item/open';
    displayValue.cmd_map.__CMD_1__.url.next.id = '8';
    const encodingResult = encodeWithLayersResult(
      JSON.stringify(displayValue),
      result.layers,
      result.displayHeaders,
    );

    expect(encodingResult.success).toBe(true);
    if (!encodingResult.success) return;
    expect(encodingResult.value).not.toContain('__scheme__');

    const restored = deepDecodeScheme(encodingResult.value);
    const restoredDisplay = JSON.parse(restored.displayDecoded || restored.decoded);
    const restoredDefaultHeader = restored.displayHeaders?.find(header => (
      header.path === '/cmd_map/default'
    ));
    const restoredNestedHeader = restored.displayHeaders?.find(header => (
      header.path === '/cmd_map/__CMD_1__/url/next'
    ));
    expect(restoredDefaultHeader).toBeDefined();
    expect(restoredNestedHeader).toBeDefined();
    expect(
      restoredDisplay.cmd_map.default[restoredDefaultHeader!.headerKey],
    ).toBe(
      'sampleapp:///v1/browser/open',
    );
    expect(
      restoredDisplay.cmd_map.__CMD_1__.url.next[restoredNestedHeader!.headerKey],
    ).toBe('sampledetail://v3/item/open');
    expect(restoredDisplay.cmd_map.__CMD_1__.url.next.id).toBe('8');
  });
});
