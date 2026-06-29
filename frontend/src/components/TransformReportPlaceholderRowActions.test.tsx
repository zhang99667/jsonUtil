import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRuntimePlaceholder } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderRowActions } from './TransformReportPlaceholderRowActions';

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

const findByDataTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByDataTour(item, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByDataTour(node.props.children, dataTour));
};

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

    (findByDataTour(tree, 'transform-report-copy-placeholder-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-locate-placeholder-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-copy-placeholder-source-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-locate-placeholder-source')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-copy-placeholder-source-value')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-open-placeholder-source-scheme')[0].props.onClick as () => void)();

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

    expect(findByDataTour(tree, 'transform-report-copy-placeholder-path')).toHaveLength(1);
    expect(findByDataTour(tree, 'transform-report-copy-placeholder-source-path')).toHaveLength(1);
    expect(findByDataTour(tree, 'transform-report-locate-placeholder-path')).toHaveLength(0);
    expect(findByDataTour(tree, 'transform-report-copy-placeholder-source-value')).toHaveLength(0);
    expect(findByDataTour(tree, 'transform-report-open-placeholder-source-scheme')).toHaveLength(0);
  });
});
