import { describe, expect, it } from 'vitest';
import type { SchemeLocation } from '../utils/schemeScanner';
import {
  canApplyEditorSchemeModal,
  createClosedEditorSchemeModal,
  createOpenEditorSchemeModal,
  shouldCloseEditorSchemeModal,
} from './editorSchemeModalState';

const location: SchemeLocation = {
  path: '$.url',
  pointer: '/url',
  line: 1,
  column: 8,
  endLine: 1,
  endColumn: 23,
  value: 'app://detail',
  schemeType: 'url',
};

describe('editorSchemeModalState', () => {
  it('打开弹窗时绑定产生点击位置的输入', () => {
    expect(createOpenEditorSchemeModal(location, '{"url":"app://detail"}')).toEqual({
      isOpen: true,
      path: '$.url',
      pointer: '/url',
      value: 'app://detail',
      source: '{"url":"app://detail"}',
      readOnly: false,
    });
  });

  it('来源头小眼睛使用完整原始地址并禁止回写', () => {
    const source = 'https://example.com/page?cmd=%7B%22id%22%3A1%7D';
    const modal = createOpenEditorSchemeModal(location, '{"__url__":"https://example.com/page"}', {
      path: '$.__url__',
      kind: 'url',
      source,
    });

    expect(modal.value).toBe(source);
    expect(modal.readOnly).toBe(true);
    expect(canApplyEditorSchemeModal(modal, modal.source)).toBe(false);
  });

  it('输入变化后关闭旧弹窗并拒绝旧指针回写', () => {
    const modal = createOpenEditorSchemeModal(location, '{"url":"app://detail"}');

    expect(shouldCloseEditorSchemeModal(modal, '{"url":"app://detail"}')).toBe(false);
    expect(canApplyEditorSchemeModal(modal, '{"url":"app://detail"}')).toBe(true);
    expect(shouldCloseEditorSchemeModal(modal, '{"url":"app://other"}')).toBe(true);
    expect(canApplyEditorSchemeModal(modal, '{"url":"app://other"}')).toBe(false);
  });

  it('关闭状态不能触发回写', () => {
    const modal = createClosedEditorSchemeModal();

    expect(modal.isOpen).toBe(false);
    expect(canApplyEditorSchemeModal(modal, '')).toBe(false);
    expect(shouldCloseEditorSchemeModal(modal, '任意输入')).toBe(false);
  });
});
