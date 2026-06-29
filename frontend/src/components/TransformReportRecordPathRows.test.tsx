import { describe, expect, it, vi } from 'vitest';
import { TransformReportRecordPathRow } from './TransformReportRecordPathRow';
import { TransformReportRecordPathRows } from './TransformReportRecordPathRows';

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

describe('TransformReportRecordPathRows', () => {
  it('渲染分组标题、更多提示并注入路径行配置', () => {
    const onCopyPath = vi.fn();
    const onCopyDecodedPathValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();
    const tree = TransformReportRecordPathRows({
      title: '内部CMD字段',
      rows: [{
        path: '$.cmd.jump_url',
        preview: 'baiduboxapp://v1/jump',
        value: 'baiduboxapp://v1/jump',
      }],
      countLabel: '2 个',
      rowKeyPrefix: '$.cmd:cmd-field',
      sectionDataTour: 'section',
      rowDataTour: 'row',
      copyPathDataTour: 'copy-path',
      copyValueDataTour: 'copy-value',
      locateDataTour: 'locate',
      schemeDataTour: 'open-scheme',
      rowClassName: 'row-class',
      pathClassName: 'path-class',
      valueClassName: 'value-class',
      moreContent: '还有更多内部 CMD 字段未展示',
      onCopyPath,
      onCopyDecodedPathValue,
      onLocatePath,
      onOpenSchemeValue,
    });

    expect(collectText(tree)).toContain('内部CMD字段 · 显示 1/2 个');
    expect(collectText(tree)).toContain('还有更多内部 CMD 字段未展示');

    const rowComponents = findByType(tree, TransformReportRecordPathRow);
    expect(rowComponents).toHaveLength(1);
    expect(rowComponents[0].props.row).toEqual({
      path: '$.cmd.jump_url',
      preview: 'baiduboxapp://v1/jump',
      value: 'baiduboxapp://v1/jump',
    });
    expect(rowComponents[0].props.copyPathDataTour).toBe('copy-path');
    expect(rowComponents[0].props.onCopyPath).toBe(onCopyPath);
    expect(rowComponents[0].props.onCopyDecodedPathValue).toBe(onCopyDecodedPathValue);
    expect(rowComponents[0].props.onLocatePath).toBe(onLocatePath);
    expect(rowComponents[0].props.onOpenSchemeValue).toBe(onOpenSchemeValue);
  });
});
