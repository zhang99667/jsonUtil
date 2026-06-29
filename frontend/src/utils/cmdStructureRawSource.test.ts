import { describe, expect, it } from 'vitest';
import {
  collectRawCmdCandidates,
  decodeRawCmdCandidate,
  findRawResponseCmdStructure,
  normalizeRawSourceString,
} from './cmdStructureRawSource';
import type { RawCmdCandidate } from './cmdStructureRawSource';

describe('cmdStructureRawSource', () => {
  it('收集 response 内可解析的原始 CMD 候选并保留路径', () => {
    const candidates: RawCmdCandidate[] = [];

    collectRawCmdCandidates({
      data: {
        action_cmd: 'baiduboxapp://v1/panel?tab=reward',
        landing: {
          url: 'https://example.com/landing?sku=101',
        },
        placeholder: '__CONVERT_CMD__',
      },
    }, candidates);

    expect(candidates.map(candidate => ({
      path: candidate.path,
      sourceLabel: candidate.sourceLabel,
      priority: candidate.priority,
    }))).toEqual([
      { path: '$.data.action_cmd', sourceLabel: 'action_cmd', priority: 96 },
      { path: '$.data.landing.url', sourceLabel: 'url', priority: 30 },
    ]);
  });

  it('解码 URL 编码的 JSON 参数为结构化 cmdParams', () => {
    const params = {
      phone: '13718164578',
      extInfo: 'AFDXXX',
      type: '1',
    };
    const source = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${encodeURIComponent(JSON.stringify(params))}`;

    expect(decodeRawCmdCandidate(source)).toEqual({
      cmdSchema: 'baiduboxapp://v7/vendor/ad/makePhoneCall',
      cmdParams: {
        params,
      },
      source,
    });
  });

  it('从混合 response 中优先选择业务 CMD 字段而非普通 URL', () => {
    const structure = findRawResponseCmdStructure({
      data: {
        url: 'https://example.com/landing?sku=101',
        scheme: 'baiduboxapp://v1/panel?tab=reward',
      },
    });

    expect(structure).toMatchObject({
      cmdSchema: 'baiduboxapp://v1/panel',
      cmdParams: {
        tab: 'reward',
      },
    });
  });

  it('归一化原始来源中的转义斜杠但不破坏 URL 编码内容', () => {
    const encodedParams = '%7B%22url%22%3A%22https%3A%5C%2F%5C%2Fexample.com%22%7D';

    expect(normalizeRawSourceString(` https:\\/\\/example.com/path?params=${encodedParams} `)).toBe(
      `https://example.com/path?params=${encodedParams}`
    );
  });
});
