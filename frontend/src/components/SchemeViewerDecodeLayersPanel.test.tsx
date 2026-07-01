import { describe, expect, it } from 'vitest';
import type { DecodeLayer } from '../utils/schemeTypes';
import { SchemeViewerDecodeLayersPanel } from './SchemeViewerDecodeLayersPanel';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const collectByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => collectByTour(child, dataTour));
  if (!isElementLike(node)) return [];
  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  const children = node.props.children;
  if (Array.isArray(children)) {
    return [...matches, ...children.flatMap(child => collectByTour(child, dataTour))];
  }
  return [...matches, ...collectByTour(children, dataTour)];
};

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
    const layerNodes = collectByTour(tree, 'scheme-decode-layer');

    expect(collectByTour(tree, 'scheme-decode-layers')).toHaveLength(1);
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
