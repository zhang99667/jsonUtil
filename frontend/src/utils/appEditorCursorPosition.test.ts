import { describe, expect, it } from 'vitest';
import { shouldAcceptEditorCursorPosition } from './appEditorCursorPosition';

describe('shouldAcceptEditorCursorPosition', () => {
  it('SOURCE 活跃时忽略 PREVIEW 因结果刷新产生的光标事件', () => {
    expect(shouldAcceptEditorCursorPosition('SOURCE', 'SOURCE')).toBe(true);
    expect(shouldAcceptEditorCursorPosition('SOURCE', 'PREVIEW')).toBe(false);
  });

  it('PREVIEW 活跃时忽略 SOURCE 光标事件，避免状态栏串位', () => {
    expect(shouldAcceptEditorCursorPosition('PREVIEW', 'SOURCE')).toBe(false);
    expect(shouldAcceptEditorCursorPosition('PREVIEW', 'PREVIEW')).toBe(true);
  });

  it('未聚焦编辑器时默认接受 SOURCE 初始光标事件', () => {
    expect(shouldAcceptEditorCursorPosition(null, 'SOURCE')).toBe(true);
    expect(shouldAcceptEditorCursorPosition(null, 'PREVIEW')).toBe(false);
  });
});
