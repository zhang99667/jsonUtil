import { describe, expect, it, vi } from 'vitest';
import { TransformReportRecordPathRow } from './TransformReportRecordPathRow';
import { TransformReportRecordPathRowActions } from './TransformReportRecordPathRowActions';
import { collectText, findByType } from './componentElementTestHelpers';

describe('TransformReportRecordPathRow', () => {
  it('展示路径和值并注入路径行动作配置', () => {
    const onCopyPath = vi.fn();
    const onCopyDecodedPathValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();
    const tree = TransformReportRecordPathRow({
      row: {
        path: '$.cmd.jump_url',
        preview: 'baiduboxapp://v1/jump',
        value: 'baiduboxapp://v1/jump',
      },
      rowDataTour: 'row',
      copyPathDataTour: 'copy-path',
      copyValueDataTour: 'copy-value',
      locateDataTour: 'locate',
      schemeDataTour: 'open-scheme',
      rowClassName: 'row-class',
      pathClassName: 'path-class',
      valueClassName: 'value-class',
      onCopyPath,
      onCopyDecodedPathValue,
      onLocatePath,
      onOpenSchemeValue,
    });

    const text = collectText(tree);
    expect(text).toContain('$.cmd.jump_url');
    expect(text).toContain('baiduboxapp://v1/jump');

    const actions = findByType(tree, TransformReportRecordPathRowActions);
    expect(actions).toHaveLength(1);
    expect(actions[0].props.copyPathDataTour).toBe('copy-path');
    expect(actions[0].props.copyValueDataTour).toBe('copy-value');
    expect(actions[0].props.locateDataTour).toBe('locate');
    expect(actions[0].props.schemeDataTour).toBe('open-scheme');
    expect(actions[0].props.onCopyPath).toBe(onCopyPath);
    expect(actions[0].props.onCopyDecodedPathValue).toBe(onCopyDecodedPathValue);
    expect(actions[0].props.onLocatePath).toBe(onLocatePath);
    expect(actions[0].props.onOpenSchemeValue).toBe(onOpenSchemeValue);
  });
});
