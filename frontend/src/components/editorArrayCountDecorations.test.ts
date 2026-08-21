import { describe, expect, it } from 'vitest';
import { buildEditorArrayCountDecorationSpecs } from './editorArrayCountDecorations';

describe('buildEditorArrayCountDecorationSpecs', () => {
  it('在数组左括号后构建数量标记', () => {
    expect(buildEditorArrayCountDecorationSpecs([{
      path: '$.cross_session_context',
      pointer: '/cross_session_context',
      line: 2,
      column: 28,
      itemCount: 4,
    }])).toEqual([{
      line: 2,
      column: 28,
      content: '  4 项',
      hoverText: '数组路径: $.cross_session_context\n\n共 4 项',
    }]);
  });

  it('没有长数组时不生成标记', () => {
    expect(buildEditorArrayCountDecorationSpecs([])).toEqual([]);
  });
});
