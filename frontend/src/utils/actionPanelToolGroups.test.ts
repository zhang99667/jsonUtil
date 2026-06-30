import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import {
  ACTION_PANEL_TOOL_GROUPS,
  ACTION_PANEL_TOOL_ICON_IDS,
} from './actionPanelToolGroups';

const flattenToolModes = () => (
  ACTION_PANEL_TOOL_GROUPS.flatMap(group => group.items.map(item => item.mode))
);

describe('actionPanelToolGroups', () => {
  it('覆盖所有主工具转换模式且不重复', () => {
    const modes = flattenToolModes();

    expect(new Set(modes).size).toBe(modes.length);
    expect(modes).toEqual([
      TransformMode.NONE,
      TransformMode.FORMAT,
      TransformMode.DEEP_FORMAT,
      TransformMode.MINIFY,
      TransformMode.ESCAPE,
      TransformMode.UNESCAPE,
      TransformMode.UNICODE_TO_CN,
      TransformMode.CN_TO_UNICODE,
      TransformMode.URL_ENCODE,
      TransformMode.URL_DECODE,
      TransformMode.BASE64_ENCODE,
      TransformMode.BASE64_DECODE,
      TransformMode.SORT_KEYS,
      TransformMode.JSON_TO_TYPESCRIPT,
    ]);
  });

  it('保留工具栏分组和引导锚点', () => {
    expect(ACTION_PANEL_TOOL_GROUPS.map(group => group.title)).toEqual([
      '预览 / 输出',
      '编码 / 转义',
      '整理 / 生成',
    ]);

    const items = ACTION_PANEL_TOOL_GROUPS.flatMap(group => group.items);
    expect(items.find(item => item.mode === TransformMode.DEEP_FORMAT)).toMatchObject({
      label: '嵌套解析',
      dataTour: 'deep-format-btn',
    });
    expect(items.find(item => item.mode === TransformMode.ESCAPE)).toMatchObject({
      label: '转义',
      dataTour: 'escape-btn',
    });
    expect(items.find(item => item.mode === TransformMode.JSON_TO_TYPESCRIPT)).toMatchObject({
      label: 'JSON 转 TS',
      dataTour: 'json-to-ts-btn',
    });
  });

  it('所有工具配置都使用显式支持的图标 id', () => {
    const supportedIconIds = new Set(ACTION_PANEL_TOOL_ICON_IDS);

    ACTION_PANEL_TOOL_GROUPS.flatMap(group => group.items).forEach(item => {
      expect(supportedIconIds.has(item.iconId)).toBe(true);
    });
  });
});
