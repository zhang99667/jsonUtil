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

  it('结构化扫描保留数组和特殊 key 路径，并跳过缺少 cmdParams 的对象', () => {
    const candidates = collectActualCmdStructureCandidates({
      list: [
        {
          'cmd-key': {
            cmdSchema: 'baiduboxapp://v1/special',
            cmdParams: {
              token: 'abc',
            },
            source: 'baiduboxapp://v1/special?token=abc',
          },
        },
        {
          cmdSchema: 'baiduboxapp://v1/missing-params',
        },
      ],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      id: '$.list[0]["cmd-key"]',
      label: '$.list[0]["cmd-key"]',
      sourceLabel: 'cmd-key',
      commandSchema: 'baiduboxapp://v1/special',
      actual: {
        cmdSchema: 'baiduboxapp://v1/special',
        cmdParams: {
          token: 'abc',
        },
        source: 'baiduboxapp://v1/special?token=abc',
      },
    });
  });

  it('根结构化候选仅保留字符串 schema 和 source 字段', () => {
    expect(collectActualCmdStructureCandidates(null)).toEqual([]);

    const candidates = collectActualCmdStructureCandidates({
      cmdSchema: 123,
      cmdParams: {
        stable: 'ok',
      },
      source: {
        raw: true,
      },
    });

    expect(candidates).toEqual([
      {
        id: '$',
        label: '$',
        sourceLabel: undefined,
        commandSchema: undefined,
        actual: {
          cmdParams: {
            stable: 'ok',
          },
        },
      },
    ]);
  });
});
