import { describe, expect, it } from 'vitest';
import type {
  SchemePlaceholder,
  SchemePlaceholderGroup,
} from '../utils/schemeTypes';
import { SchemeViewerRuntimePlaceholdersPanel } from './SchemeViewerRuntimePlaceholdersPanel';

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

const buildPlaceholders = (): SchemePlaceholder[] => [
  { path: '$.user.name', value: '${USER_NAME}', description: '用户名' },
  { path: '$.user.city', value: '${CITY}', description: '城市' },
  { path: '$.items[0].id', value: '${ITEM_ID}', description: '商品 ID' },
  { path: '$.items[1].id', value: '${ITEM_ID}', description: '商品 ID' },
  { path: '$.items[2].id', value: '${ITEM_ID}', description: '商品 ID' },
  { path: '$.items[3].id', value: '${ITEM_ID}', description: '商品 ID' },
  { path: '$.items[4].id', value: '${ITEM_ID}', description: '商品 ID' },
];

const buildGroups = (): SchemePlaceholderGroup[] => [
  {
    value: '${ITEM_ID}',
    description: '商品 ID',
    count: 5,
    paths: ['$.items[0].id', '$.items[1].id'],
  },
  {
    value: '${USER_NAME}',
    description: '用户名',
    count: 1,
    paths: ['$.user.name'],
  },
];

describe('SchemeViewerRuntimePlaceholdersPanel', () => {
  it('没有占位符时不渲染', () => {
    expect(SchemeViewerRuntimePlaceholdersPanel({
      placeholders: [],
      placeholderGroups: [],
    })).toBeNull();
  });

  it('渲染占位符分组、前 6 条路径明细和剩余数量', () => {
    const tree = SchemeViewerRuntimePlaceholdersPanel({
      placeholders: buildPlaceholders(),
      placeholderGroups: buildGroups(),
    });
    const text = collectText(tree);

    expect(findByTourOrNull(tree, 'scheme-runtime-placeholders')).toBeTruthy();
    expect(findByTourOrNull(tree, 'scheme-runtime-placeholder-groups')).toBeTruthy();
    expect(text).toContain('运行时占位符 · 7');
    expect(text).toContain('${ITEM_ID} ×5');
    expect(text).toContain('$.user.name=${USER_NAME}');
    expect(text).toContain('$.items[3].id=${ITEM_ID}');
    expect(text).toContain('+1');
    expect(text).not.toContain('$.items[4].id=${ITEM_ID}');
  });

  it('长占位符值按弹窗预览规则截断', () => {
    const longValue = `\${${'A'.repeat(40)}}`;
    const tree = SchemeViewerRuntimePlaceholdersPanel({
      placeholders: [{
        path: '$.long',
        value: longValue,
        description: '长占位符',
      }],
      placeholderGroups: [{
        value: longValue,
        description: '长占位符',
        count: 1,
        paths: ['$.long'],
      }],
    });

    expect(collectText(tree)).toContain(`${longValue.slice(0, 32)}...`);
  });
});
