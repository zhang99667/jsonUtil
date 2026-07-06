import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRuntimePlaceholder } from '../utils/transformRuntimePlaceholderTypes';
import { clickElement, findByTour } from './componentElementTestHelpers';
import { TransformReportPlaceholderRowActions } from './TransformReportPlaceholderRowActions';

const placeholder: TransformReportRuntimePlaceholder = {
  path: '$.cmd.uid',
  sourcePath: '$.cmd',
  sourceLabel: 'scheme',
  sourceOriginalValue: 'cmd=__UID__',
  sourceOriginalPreview: 'cmd=__UID__',
  value: '__UID__',
  description: '用户 ID',
};

describe('TransformReportPlaceholderRowActions', () => {
  it('转发占位符路径、来源路径、来源值和 Scheme 动作', () => {
    const onCopyPath = vi.fn();
    const onCopyOriginalValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();
    const tree = TransformReportPlaceholderRowActions({
      placeholder,
      onCopyPath,
      onCopyOriginalValue,
      onLocatePath,
      onOpenSchemeValue,
    });

    clickElement(findByTour(tree, 'transform-report-copy-placeholder-path')[0]);
    clickElement(findByTour(tree, 'transform-report-locate-placeholder-path')[0]);
    clickElement(findByTour(tree, 'transform-report-copy-placeholder-source-path')[0]);
    clickElement(findByTour(tree, 'transform-report-locate-placeholder-source')[0]);
    clickElement(findByTour(tree, 'transform-report-copy-placeholder-source-value')[0]);
    clickElement(findByTour(tree, 'transform-report-open-placeholder-source-scheme')[0]);

    expect(onCopyPath).toHaveBeenCalledWith('$.cmd.uid');
    expect(onCopyPath).toHaveBeenCalledWith('$.cmd', '已复制来源路径');
    expect(onLocatePath).toHaveBeenCalledWith('$.cmd.uid');
    expect(onLocatePath).toHaveBeenCalledWith('$.cmd');
    expect(onCopyOriginalValue).toHaveBeenCalledWith('cmd=__UID__', '已复制来源值');
    expect(onOpenSchemeValue).toHaveBeenCalledWith('cmd=__UID__');
  });

  it('没有可选动作入口时隐藏定位、来源值和 Scheme 按钮', () => {
    const tree = TransformReportPlaceholderRowActions({
      placeholder: {
        ...placeholder,
        sourceOriginalValue: undefined,
        sourceOriginalPreview: undefined,
      },
      onCopyPath: vi.fn(),
      onCopyOriginalValue: vi.fn(),
    });

    expect(findByTour(tree, 'transform-report-copy-placeholder-path')).toHaveLength(1);
    expect(findByTour(tree, 'transform-report-copy-placeholder-source-path')).toHaveLength(1);
    expect(findByTour(tree, 'transform-report-locate-placeholder-path')).toHaveLength(0);
    expect(findByTour(tree, 'transform-report-copy-placeholder-source-value')).toHaveLength(0);
    expect(findByTour(tree, 'transform-report-open-placeholder-source-scheme')).toHaveLength(0);
  });
});
