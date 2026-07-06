import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { COMMAND_SCHEMA_ROW_DISPLAY_LIMIT } from './TransformReportPanelAtoms';
import { TransformReportCommandSchemaRows } from './TransformReportCommandSchemaRows';

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
    expect(findByTour(tree, 'transform-report-command-schema-row')).toHaveLength(COMMAND_SCHEMA_ROW_DISPLAY_LIMIT);

    clickElement(findByTour(tree, 'transform-report-copy-command-schema-path')[0]);
    clickElement(findByTour(tree, 'transform-report-copy-command-schema-row')[0]);
    clickElement(findByTour(tree, 'transform-report-locate-command-schema-path')[0]);

    expect(onCopyPath).toHaveBeenCalledWith('$.cmd.cmdSchema0');
    expect(onCopyDecodedPathValue).toHaveBeenCalledWith('$.cmd.cmdSchema0 = "baiduboxapp://v1/open0"');
    expect(onLocatePath).toHaveBeenCalledWith('$.cmd.cmdSchema0');
  });
});
