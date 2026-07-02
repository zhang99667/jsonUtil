import { describe, expect, it } from 'vitest';
import type { DecodeLayer } from '../utils/schemeTypes';
import { SchemeViewerDecodeLayersPanel } from './SchemeViewerDecodeLayersPanel';
import { collectText, findByTour } from './schemeViewerElementTestHelpers';

const buildLayers = (): DecodeLayer[] => [
  {
    type: 'url-encoded',
    before: '%7B%22name%22%3A%22mark%22%7D',
    after: '{"name":"mark"}',
    description: 'URL Decode',
  },
  {
    type: 'json',
    before: '{"name":"mark"}',
    description: 'JSON Parse',
    reversible: false,
  },
];

describe('SchemeViewerDecodeLayersPanel', () => {
  it('没有解码层时不渲染', () => {
    expect(SchemeViewerDecodeLayersPanel({
      layers: [],
      decodedContent: '',
      isJson: false,
    })).toBeNull();
  });

  it('渲染解码链路摘要、层级类型和可回写状态', () => {
    const tree = SchemeViewerDecodeLayersPanel({
      layers: buildLayers(),
      decodedContent: '{\n  "name": "mark"\n}',
      isJson: true,
    });
    const text = collectText(tree);
    const layerNodes = findByTour(tree, 'scheme-decode-layer');

    expect(findByTour(tree, 'scheme-decode-layers')).toHaveLength(1);
    expect(layerNodes).toHaveLength(2);
    expect(text).toContain('解析链路 · 2 层');
    expect(text).toContain('原始 → JSON');
    expect(text).toContain('URL Decode');
    expect(text).toContain('URL Decode');
    expect(text).toContain('JSON Parse');
    expect(text).toContain('只读');
    expect(layerNodes[1].props.title).toContain('输出预览:\n{\n  "name": "mark"\n}');
  });

  it('非 JSON 结果显示文本目标', () => {
    const tree = SchemeViewerDecodeLayersPanel({
      layers: [buildLayers()[0]],
      decodedContent: 'plain text',
      isJson: false,
    });

    expect(collectText(tree)).toContain('原始 → 文本');
  });
});
