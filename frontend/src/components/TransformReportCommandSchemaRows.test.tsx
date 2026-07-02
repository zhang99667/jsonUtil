import { describe, expect, it, vi } from 'vitest';
import { COMMAND_SCHEMA_ROW_DISPLAY_LIMIT } from './TransformReportPanelAtoms';
import { TransformReportCommandSchemaRows } from './TransformReportCommandSchemaRows';

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

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const findByDataTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByDataTour(item, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByDataTour(node.props.children, dataTour));
};

describe('TransformReportCommandSchemaRows', () => {
  it('展示 CMD Schema 路径并转发复制和定位动作', () => {
    const onCopyPath = vi.fn();
    const onCopyDecodedPathValue = vi.fn();
    const onLocatePath = vi.fn();
    const rows = Array.from({ length: COMMAND_SCHEMA_ROW_DISPLAY_LIMIT + 1 }, (_, index) => ({
      path: `$.cmd.cmdSchema${index}`,
      schema: `baiduboxapp://v1/open${index}`,
    }));
    const tree = TransformReportCommandSchemaRows({
      recordPath: '$.cmd',
      rows,
      actions: {
        onCopyPath,
        onCopyDecodedPathValue,
        onLocatePath,
      },
    });

    expect(collectText(tree)).toContain(`CMD Schema路径 · 显示 ${COMMAND_SCHEMA_ROW_DISPLAY_LIMIT}/${rows.length} 条`);
    expect(collectText(tree)).toContain('还有更多 CMD Schema 路径未展示');
    expect(findByDataTour(tree, 'transform-report-command-schema-row')).toHaveLength(COMMAND_SCHEMA_ROW_DISPLAY_LIMIT);

    (findByDataTour(tree, 'transform-report-copy-command-schema-path')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-copy-command-schema-row')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-locate-command-schema-path')[0].props.onClick as () => void)();

    expect(onCopyPath).toHaveBeenCalledWith('$.cmd.cmdSchema0');
    expect(onCopyDecodedPathValue).toHaveBeenCalledWith('$.cmd.cmdSchema0 = "baiduboxapp://v1/open0"');
    expect(onLocatePath).toHaveBeenCalledWith('$.cmd.cmdSchema0');
  });
});
