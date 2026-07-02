import { describe, expect, it } from 'vitest';
import type { SchemeParamDecodeStage } from '../utils/schemeTypes';
import { SchemeViewerParamStagesPanel } from './SchemeViewerParamStagesPanel';
import { collectText, findByTour } from './schemeViewerElementTestHelpers';

const buildStage = (overrides: Partial<SchemeParamDecodeStage> = {}): SchemeParamDecodeStage => ({
  path: '$.params.url',
  key: 'url',
  source: 'query',
  raw: '%7B%22skuId%22%3A%22243%22%7D',
  urlDecoded: '{"skuId":"243"}',
  parsed: '{"skuId":"243"}',
  reencoded: '%7B%22skuId%22%3A%22243%22%7D',
  reversible: true,
  ...overrides,
});

describe('SchemeViewerParamStagesPanel', () => {
  it('没有参数分层时不渲染', () => {
    expect(SchemeViewerParamStagesPanel({ paramStages: [] })).toBeNull();
  });

  it('渲染参数分层链路、修复提示和可重新编码状态', () => {
    const tree = SchemeViewerParamStagesPanel({
      paramStages: [buildStage({ repairHint: '补齐 loose JSON 引号' })],
    });
    const text = collectText(tree);
    const stage = findByTour(tree, 'scheme-param-stage')[0];

    expect(findByTour(tree, 'scheme-param-stages')).toHaveLength(1);
    expect(text).toContain('参数分层 · 1');
    expect(text).toContain('Raw → URL Decode → JSON/CMD 解析 → 重新编码');
    expect(text).toContain('Query');
    expect(text).toContain('$.params.url');
    expect(text).toContain('补齐 loose JSON 引号');
    expect(text).toContain('可重新编码');
    expect(stage.props.title).toContain('修复提示: 补齐 loose JSON 引号');
  });

  it('最多展示前 6 个参数分层并提示剩余数量', () => {
    const paramStages = Array.from({ length: 7 }, (_, index) => buildStage({
      path: `$.params.item${index}`,
      key: `item${index}`,
      reversible: index % 2 === 0,
    }));
    const tree = SchemeViewerParamStagesPanel({ paramStages });
    const text = collectText(tree);

    expect(findByTour(tree, 'scheme-param-stage')).toHaveLength(6);
    expect(text).toContain('还有 1 个参数分层未展示');
    expect(text).toContain('需确认');
    expect(text).not.toContain('$.params.item6');
  });
});
