import { describe, expect, it, vi } from 'vitest';
import { TransformReportRecordPathRowActions } from './TransformReportRecordPathRowActions';

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

    (findByDataTour(tree, 'copy-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'copy-value')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'locate')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'open-scheme')[0].props.onClick as () => void)();

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

    expect(findByDataTour(tree, 'copy-path')).toHaveLength(1);
    expect(findByDataTour(tree, 'copy-value')).toHaveLength(1);
    expect(findByDataTour(tree, 'locate')).toHaveLength(0);
    expect(findByDataTour(tree, 'open-scheme')).toHaveLength(0);
  });
});
