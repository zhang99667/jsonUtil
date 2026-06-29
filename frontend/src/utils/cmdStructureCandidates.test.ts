import { describe, expect, it } from 'vitest';
import { collectActualCmdStructureCandidates } from './cmdStructureCandidates';

describe('cmdStructureCandidates', () => {
  it('从原始 CMD 字符串中收集根候选和解码后的内层候选', () => {
    const innerCmd = 'baiduboxapp://v1/deeplink?foo=bar';
    const source = `baiduboxapp://v1/panel?panel_cmd=${encodeURIComponent(innerCmd)}`;

    const candidates = collectActualCmdStructureCandidates({
      data: {
        scheme: source,
      },
    });

    expect(candidates.map(candidate => candidate.id)).toEqual([
      '$.data.scheme',
      '$.data.scheme.cmdParams.panel_cmd',
    ]);
    expect(candidates[0]).toMatchObject({
      sourceLabel: 'scheme',
      commandSchema: 'baiduboxapp://v1/panel',
    });
    expect(candidates[1]).toMatchObject({
      sourceLabel: 'panel_cmd',
      commandSchema: 'baiduboxapp://v1/deeplink',
    });
  });

  it('从已结构化对象中收集嵌套 CMD 候选并保留业务字段名', () => {
    const candidates = collectActualCmdStructureCandidates({
      result: {
        cmdSchema: 'baiduboxapp://v1/root',
        cmdParams: {
          nested_cmd: {
            cmdSchema: 'baiduboxapp://v1/nested',
            cmdParams: {
              token: 'abc',
            },
          },
        },
      },
    });

    expect(candidates.map(candidate => candidate.id)).toEqual([
      '$.result',
      '$.result.cmdParams.nested_cmd',
    ]);
    expect(candidates[1]).toMatchObject({
      sourceLabel: 'nested_cmd',
      commandSchema: 'baiduboxapp://v1/nested',
    });
  });
});
