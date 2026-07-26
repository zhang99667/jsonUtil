import { describe, expect, it } from 'vitest';
import { deepDecodeScheme } from './schemeUtils';

const COMMAND_KEYS = ['default', '__CMD_1__', '__CMD_2__', '__CMD_3__', '__CMD_4__'] as const;
const COMMAND_HEADER = 'sampleapp:///v1/browser/open';
const LANDING_HEADER = 'https://m.example.com/detail';

const createCommand = (key: string, index: number): string => {
  const landingUrl = [
    `${LANDING_HEADER}?fid=${key}`,
    'ch=3',
    `bd_vid=video-${index}-a`,
    `bd_vid=video-${index}-b`,
    'newEb=1',
    'isc=1',
  ].join('&');
  return `${COMMAND_HEADER}?url=${encodeURIComponent(landingUrl)}`;
};

describe('Scheme CMD 映射协议头', () => {
  it('完整 CMD 映射保留每条命令、内层 HTTPS 协议头和区域占位符', () => {
    const source = JSON.stringify({
      area_cmd: {
        pop_button: '__CMD_2__',
        pop_hotarea: '__CMD_1__',
        nested: {
          primary: '__CMD_4__',
          fallback: '__CMD_3__',
          unmapped: '__CMD_9__',
        },
      },
      cmd_map: Object.fromEntries(
        COMMAND_KEYS.map((key, index) => [key, createCommand(key, index)]),
      ),
    });

    const result = deepDecodeScheme(source);
    const businessValue = JSON.parse(result.decoded);
    const displayValue = JSON.parse(result.displayDecoded || result.decoded);

    expect(businessValue.area_cmd).toEqual({
      pop_button: '__CMD_2__',
      pop_hotarea: '__CMD_1__',
      nested: {
        primary: '__CMD_4__',
        fallback: '__CMD_3__',
        unmapped: '__CMD_9__',
      },
    });
    expect(displayValue.area_cmd).toEqual(businessValue.area_cmd);
    expect(result.displayHeaders).toHaveLength(COMMAND_KEYS.length * 2);

    COMMAND_KEYS.forEach((key, index) => {
      const commandPath = `/cmd_map/${key}`;
      const commandHeader = result.displayHeaders?.find(header => header.path === commandPath);
      const landingHeader = result.displayHeaders?.find(header => header.path === `${commandPath}/url`);
      expect(commandHeader?.header).toBe(COMMAND_HEADER);
      expect(landingHeader?.header).toBe(LANDING_HEADER);
      if (!commandHeader || !landingHeader) return;
      expect(displayValue.cmd_map[key][commandHeader.headerKey]).toBe(COMMAND_HEADER);
      expect(displayValue.cmd_map[key].url[landingHeader.headerKey]).toBe(LANDING_HEADER);
      expect(businessValue.cmd_map[key].url.bd_vid).toEqual([
        `video-${index}-a`,
        `video-${index}-b`,
      ]);
    });

    expect(result.decoded).not.toContain('__scheme__');
    expect(result.displayDecoded).not.toContain('__scheme_display_event_');
  });
});
