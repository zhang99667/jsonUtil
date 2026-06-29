import { describe, expect, it } from 'vitest';
import {
  buildSchemePlaceholderGroups,
  collectRuntimePlaceholders,
  getRuntimePlaceholderDescription,
  isRuntimePlaceholder,
} from './schemePlaceholders';

describe('schemePlaceholders', () => {
  it('识别运行时占位符并提供业务说明', () => {
    expect(isRuntimePlaceholder('__CONVERT_CMD__')).toBe(true);
    expect(isRuntimePlaceholder('__lower_case__')).toBe(false);
    expect(getRuntimePlaceholderDescription('__CALLBACK_URL__')).toBe(
      '回调 URL 占位符，监测链路会在运行时替换'
    );
    expect(getRuntimePlaceholderDescription('__UNKNOWN_RUNTIME__')).toBe(
      '运行时占位符，当前文本未包含可继续展开的实际内容'
    );
  });

  it('递归收集对象和数组中的运行时占位符路径', () => {
    expect(collectRuntimePlaceholders({
      cmd: '__CONVERT_CMD__',
      list: [
        '__WEBPANEL_CMD__',
        { 'bad-key': '__CALLBACK_URL__' },
      ],
      plain: 'text',
    })).toEqual([
      {
        path: '$.cmd',
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
      },
      {
        path: '$.list[0]',
        value: '__WEBPANEL_CMD__',
        description: '运行时 WebPanel CMD 占位符，当前文本未包含实际 CMD 内容',
      },
      {
        path: '$.list[1]["bad-key"]',
        value: '__CALLBACK_URL__',
        description: '回调 URL 占位符，监测链路会在运行时替换',
      },
    ]);
  });

  it('按占位符值聚合并稳定排序', () => {
    expect(buildSchemePlaceholderGroups([
      {
        path: '$.a',
        value: '__WEBPANEL_CMD__',
        description: '运行时 WebPanel CMD 占位符，当前文本未包含实际 CMD 内容',
      },
      {
        path: '$.b',
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
      },
      {
        path: '$.c',
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
      },
    ])).toEqual([
      {
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
        count: 2,
        paths: ['$.b', '$.c'],
      },
      {
        value: '__WEBPANEL_CMD__',
        description: '运行时 WebPanel CMD 占位符，当前文本未包含实际 CMD 内容',
        count: 1,
        paths: ['$.a'],
      },
    ]);
  });
});
