import { describe, expect, it } from 'vitest';
import {
  buildRuntimePlaceholderGroups,
  matchesRuntimePlaceholder,
} from './transformRuntimePlaceholders';
import type { TransformReportRuntimePlaceholder } from './transformRuntimePlaceholderTypes';

const createPlaceholder = (
  overrides: Partial<TransformReportRuntimePlaceholder> = {}
): TransformReportRuntimePlaceholder => ({
  path: '$.cmd.button',
  sourcePath: '$.cmd',
  value: '__CONVERT_CMD__',
  description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
  ...overrides,
});

describe('transformRuntimePlaceholders', () => {
  it('按占位符值和来源聚合，并保持稳定排序', () => {
    const groups = buildRuntimePlaceholderGroups([
      createPlaceholder({ path: '$.first', sourcePath: '$.action_cmd', sourceLabel: 'actionCmd' }),
      createPlaceholder({ path: '$.second', sourcePath: '$.action_cmd', sourceLabel: 'actionCmd' }),
      createPlaceholder({ path: '$.third', sourcePath: '$.extra[0].v', sourceLabel: 'extraParam' }),
      createPlaceholder({
        path: '$.webpanel',
        sourcePath: '$.panel',
        value: '__WEBPANEL_CMD__',
        description: 'WebPanel 占位符',
      }),
    ]);

    expect(groups.map(group => ({
      value: group.value,
      count: group.count,
      sourceCount: group.sourceCount,
      sources: group.sources.map(source => ({
        sourcePath: source.sourcePath,
        count: source.count,
      })),
    }))).toEqual([
      {
        value: '__CONVERT_CMD__',
        count: 3,
        sourceCount: 2,
        sources: [
          { sourcePath: '$.action_cmd', count: 2 },
          { sourcePath: '$.extra[0].v', count: 1 },
        ],
      },
      {
        value: '__WEBPANEL_CMD__',
        count: 1,
        sourceCount: 1,
        sources: [
          { sourcePath: '$.panel', count: 1 },
        ],
      },
    ]);
  });

  it('匹配占位符值、来源标签、占位符快捷词和待处理快捷词', () => {
    const placeholder = createPlaceholder({
      sourceLabel: 'buttonParam',
      value: '__BUTTON_CMD__',
      description: '按钮 CMD 占位符',
    });

    expect(matchesRuntimePlaceholder(placeholder, '__button_cmd__')).toBe(true);
    expect(matchesRuntimePlaceholder(placeholder, 'buttonparam')).toBe(true);
    expect(matchesRuntimePlaceholder(placeholder, '占位符')).toBe(true);
    expect(matchesRuntimePlaceholder(placeholder, '待处理')).toBe(true);
    expect(matchesRuntimePlaceholder(placeholder, 'panel_cmd')).toBe(false);
  });

  it('仅对长片段或明显编码片段扫描来源原文', () => {
    const placeholder = createPlaceholder({
      sourceOriginalValue: 'cmd=%7B%22button_cmd%22%3A%22__CONVERT_CMD__%22%7D&source_tail_needle=1',
    });

    expect(matchesRuntimePlaceholder(placeholder, 'source_tail_needle')).toBe(true);
    expect(matchesRuntimePlaceholder(placeholder, 'needle')).toBe(false);
    expect(matchesRuntimePlaceholder(placeholder, 'button_cmd=')).toBe(false);
    expect(matchesRuntimePlaceholder(placeholder, 'cmd=%7b')).toBe(true);
  });
});
