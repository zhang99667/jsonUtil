import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import { TransformReportRecordPathRows } from './TransformReportRecordPathRows';
import { TransformReportRecordPathSections } from './TransformReportRecordPathSections';

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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const record = {
  path: '$.cmd',
  originalPreview: 'baiduboxapp://v1/open?...',
  decodedPreview: '{"uid":1}',
  decodedPaths: [{
    path: '$.cmd.uid',
    preview: '1',
    value: 1,
  }],
  decodedPathCount: 2,
  isDecodedPathCountTruncated: true,
  indexedDecodedPathCount: 3,
  hasMoreDecodedPaths: true,
  nestedCommandFields: [{
    path: '$.cmd.jump_url',
    preview: 'baiduboxapp://v1/jump',
    value: 'baiduboxapp://v1/jump',
  }],
  nestedCommandFieldCount: 2,
  indexedNestedCommandFieldCount: 3,
  hasMoreNestedCommandFields: true,
  nestedResourceFields: [{
    path: '$.cmd.image',
    preview: 'https://example.com/a.png',
    value: 'https://example.com/a.png',
  }],
  nestedResourceFieldCount: 2,
  indexedNestedResourceFieldCount: 3,
  hasMoreNestedResourceFields: true,
} as TransformReportRecord;

describe('TransformReportRecordPathSections', () => {
  it('编排内部 CMD、资源、内部路径和预览行', () => {
    const props = {
      record,
      onCopyPath: vi.fn(),
      onCopyDecodedPathValue: vi.fn(),
      onLocatePath: vi.fn(),
      onOpenSchemeValue: vi.fn(),
    };
    const tree = TransformReportRecordPathSections(props);
    const pathRows = findByType(tree, TransformReportRecordPathRows);

    expect(collectText(tree)).toContain('解析结果: {"uid":1}');
    expect(collectText(tree)).toContain('原始值: baiduboxapp://v1/open?...');
    expect(pathRows.map(row => row.props.title)).toEqual([
      '内部CMD字段',
      '静态资源字段',
      '内部路径',
    ]);
    expect(pathRows.map(row => row.props.countLabel)).toEqual(['2 个', '2 个', '2+ 条']);
    expect(pathRows[0].props.rows).toBe(record.nestedCommandFields);
    expect(pathRows[0].props.onOpenSchemeValue).toBe(props.onOpenSchemeValue);
    expect(pathRows[1].props.rows).toBe(record.nestedResourceFields);
    expect(pathRows[2].props.rows).toBe(record.decodedPaths);
    expect(pathRows[2].props.onCopyPath).toBe(props.onCopyPath);
    expect(pathRows[2].props.onCopyDecodedPathValue).toBe(props.onCopyDecodedPathValue);
    expect(pathRows[2].props.onLocatePath).toBe(props.onLocatePath);
    expect(collectText(pathRows[0].props.moreContent)).toContain('已索引 3 个');
    expect(collectText(pathRows[1].props.moreContent)).toContain('已索引 3 个');
    expect(collectText(pathRows[2].props.moreContent)).toContain('总计 2+ 条');
  });

  it('没有路径明细时只展示原始值预览', () => {
    const tree = TransformReportRecordPathSections({
      record: {
        ...record,
        decodedPreview: '',
        decodedPaths: [],
        nestedCommandFields: [],
        nestedResourceFields: [],
      },
      onCopyPath: vi.fn(),
      onCopyDecodedPathValue: vi.fn(),
    });

    expect(findByType(tree, TransformReportRecordPathRows)).toHaveLength(0);
    expect(collectText(tree)).toContain('原始值: baiduboxapp://v1/open?...');
  });
});
