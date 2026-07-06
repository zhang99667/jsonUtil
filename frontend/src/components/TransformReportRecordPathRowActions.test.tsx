import { describe, expect, it, vi } from 'vitest';
import { clickElement, findByTour } from './componentElementTestHelpers';
import { TransformReportRecordPathRowActions } from './TransformReportRecordPathRowActions';

describe('TransformReportRecordPathRowActions', () => {
  it('转发复制、定位和 Scheme 打开动作', () => {
    const onCopyPath = vi.fn();
    const onCopyDecodedPathValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();
    const tree = TransformReportRecordPathRowActions({
      row: {
        path: '$.cmd.jump_url',
        preview: 'baiduboxapp://v1/jump',
        value: 'baiduboxapp://v1/jump',
      },
      copyPathDataTour: 'copy-path',
      copyValueDataTour: 'copy-value',
      locateDataTour: 'locate',
      schemeDataTour: 'open-scheme',
      onCopyPath,
      onCopyDecodedPathValue,
      onLocatePath,
      onOpenSchemeValue,
    });

    clickElement(findByTour(tree, 'copy-path')[0]);
    clickElement(findByTour(tree, 'copy-value')[0]);
    clickElement(findByTour(tree, 'locate')[0]);
    clickElement(findByTour(tree, 'open-scheme')[0]);

    expect(onCopyPath).toHaveBeenCalledWith('$.cmd.jump_url');
    expect(onCopyDecodedPathValue).toHaveBeenCalledWith('$.cmd.jump_url = "baiduboxapp://v1/jump"');
    expect(onLocatePath).toHaveBeenCalledWith('$.cmd.jump_url');
    expect(onOpenSchemeValue).toHaveBeenCalledWith('baiduboxapp://v1/jump');
  });

  it('没有可选动作入口时隐藏对应按钮', () => {
    const tree = TransformReportRecordPathRowActions({
      row: {
        path: '$.cmd.title',
        preview: '普通文本',
        value: '普通文本',
      },
      copyPathDataTour: 'copy-path',
      copyValueDataTour: 'copy-value',
      locateDataTour: 'locate',
      onCopyPath: vi.fn(),
      onCopyDecodedPathValue: vi.fn(),
    });

    expect(findByTour(tree, 'copy-path')).toHaveLength(1);
    expect(findByTour(tree, 'copy-value')).toHaveLength(1);
    expect(findByTour(tree, 'locate')).toHaveLength(0);
    expect(findByTour(tree, 'open-scheme')).toHaveLength(0);
  });
});
