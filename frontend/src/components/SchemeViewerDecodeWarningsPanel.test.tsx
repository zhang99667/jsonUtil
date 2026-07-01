import { describe, expect, it } from 'vitest';
import type { SchemeDecodeWarning } from '../utils/schemeTypes';
import { SchemeViewerDecodeWarningsPanel } from './SchemeViewerDecodeWarningsPanel';

interface ElementLike {
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

const findByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findByTour(child, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByTour(node.props.children, dataTour));
};

const decodeWarnings: SchemeDecodeWarning[] = [{
  type: 'json_string_decode_skipped',
  message: '部分字符串过长，已跳过递归解析',
  skippedCount: 2,
  decodedStringCount: 3,
  totalStringLength: 2048,
  limit: 1024,
  paths: ['$.large'],
}];

describe('SchemeViewerDecodeWarningsPanel', () => {
  it('没有警告时不渲染', () => {
    expect(SchemeViewerDecodeWarningsPanel({ decodeWarnings: [] })).toBeNull();
  });

  it('渲染性能护栏提示和路径', () => {
    const tree = SchemeViewerDecodeWarningsPanel({ decodeWarnings });
    const text = collectText(tree);

    expect(findByTour(tree, 'scheme-decode-warnings')).toHaveLength(1);
    expect(text).toContain('性能保护 · 跳过 2');
    expect(text).toContain('部分字符串过长，已跳过递归解析');
    expect(text).toContain('$.large');
  });
});
