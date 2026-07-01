import { describe, expect, it } from 'vitest';
import type { Base64MetaInfo } from '../utils/schemeMetadata';
import { SchemeViewerBase64MetaPanel } from './SchemeViewerBase64MetaPanel';

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

const findByTourOrNull = (node: unknown, dataTour: string): ElementLike | null => {
  if (!isElementLike(node)) return null;
  if (node.props['data-tour'] === dataTour) return node;
  const children = node.props.children;
  if (Array.isArray(children)) {
    return children.map(child => findByTourOrNull(child, dataTour)).find(Boolean) || null;
  }
  return findByTourOrNull(children, dataTour);
};

const buildMetaInfo = (overrides: Partial<Base64MetaInfo> = {}): Base64MetaInfo => ({
  prefix: 'AFD',
  suffix: 'x'.repeat(40),
  suffixDecodePrefix: 'skip-prefix',
  suffixLength: 40,
  suffixDecodedCount: 8,
  suffixDecodedEntries: [
    { key: 'os', displayValue: '2' },
    { key: 'ip', displayValue: '127.0.0.1' },
    { key: 'a', displayValue: '1' },
    { key: 'b', displayValue: '2' },
    { key: 'c', displayValue: '3' },
    { key: 'd', displayValue: '4' },
    { key: 'hidden', displayValue: 'not shown' },
  ],
  ...overrides,
});

describe('SchemeViewerBase64MetaPanel', () => {
  it('无内部 Base64 元信息时不渲染', () => {
    expect(SchemeViewerBase64MetaPanel({ base64MetaInfo: null })).toBeNull();
  });

  it('渲染前缀、后缀、跳过片段、前 6 个解码参数和剩余数量', () => {
    const tree = SchemeViewerBase64MetaPanel({ base64MetaInfo: buildMetaInfo() });
    const panel = findByTourOrNull(tree, 'scheme-base64-meta');
    const text = collectText(tree);

    expect(panel).toBeTruthy();
    expect(text).toContain('内部 Base64');
    expect(text).toContain('头部=AFD');
    expect(text).toContain(`后缀=${'x'.repeat(32)}...`);
    expect(text).toContain('跳过=skip-prefix');
    expect(text).toContain('os=2');
    expect(text).toContain('d=4');
    expect(text).toContain('+2');
    expect(text).toContain('40 字符');
    expect(text).not.toContain('hidden=not shown');
  });

  it('仅在有后缀时展示后缀长度', () => {
    const tree = SchemeViewerBase64MetaPanel({
      base64MetaInfo: buildMetaInfo({
        suffix: '',
        suffixLength: 0,
        suffixDecodedCount: 1,
        suffixDecodedEntries: [{ key: 'os', displayValue: '2' }],
      }),
    });

    expect(collectText(tree)).not.toContain('0 字符');
  });
});
