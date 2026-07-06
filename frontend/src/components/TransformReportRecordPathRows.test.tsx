import { describe, expect, it, vi } from 'vitest';
import { TransformReportRecordPathRow } from './TransformReportRecordPathRow';
import { TransformReportRecordPathRows } from './TransformReportRecordPathRows';
import { collectText, findByType } from './componentElementTestHelpers';

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
