import { describe, expect, it } from 'vitest';
import { CodeEditor } from './Editor';
import { SourceEditorHeaderActions } from './EditorHeaderActions';
import { AppSourceErrorActionsSlot } from './AppSourceErrorActionsSlot';
import { AppSourceCodeEditor } from './AppSourceCodeEditor';
import { buildAppSourceCodeEditorTestProps } from './AppSourceCodeEditorTestFixture';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

describe('AppSourceCodeEditor', () => {
  it('装配 SOURCE CodeEditor 的文件、校验和头部动作参数', () => {
    const props = buildAppSourceCodeEditorTestProps();
    const tree = AppSourceCodeEditor(props);

    expect(isElementLike(tree)).toBe(true);
    if (!isElementLike(tree)) throw new Error('AppSourceCodeEditor 应返回 React 元素');
    expect(tree.type).toBe(CodeEditor);
    expect(tree.props.value).toBe('{"a":1}');
    expect(tree.props.originalValue).toBe('{"a":0}');
    expect(tree.props.path).toBe('tab-1');
    expect(tree.props.label).toBe('SOURCE');
    expect(tree.props.enableSchemeScan).toBe(true);
    expect(tree.props.error).toBe('Unexpected token');
    expect(tree.props.errorLocation).toEqual({ line: 1, column: 4 });
    expect(tree.props.warning).toBe('schema warning');
    expect(tree.props.locateErrorSignal).toBe(2);

    const headerActions = tree.props.headerActions;
    expect(isElementLike(headerActions)).toBe(true);
    if (!isElementLike(headerActions)) throw new Error('SOURCE 头部动作应为 React 元素');
    expect(headerActions.type).toBe(SourceEditorHeaderActions);
    expect(headerActions.props.hasActiveFile).toBe(true);
    expect(headerActions.props.onPasteSource).toBe(props.onPasteSource);
  });

  it('把 SOURCE 错误修复入口交给专用 slot 处理', () => {
    const invalidTree = AppSourceCodeEditor(buildAppSourceCodeEditorTestProps());
    expect(isElementLike(invalidTree)).toBe(true);
    if (!isElementLike(invalidTree)) throw new Error('AppSourceCodeEditor 应返回 React 元素');
    const errorActions = invalidTree.props.errorActions;
    expect(isElementLike(errorActions)).toBe(true);
    if (!isElementLike(errorActions)) throw new Error('SOURCE 错误操作应为 React 元素');
    expect(errorActions.type).toBe(AppSourceErrorActionsSlot);
    expect(errorActions.props.sourceValidation).toMatchObject({ isValid: false });
    expect(errorActions.props.hasSourceContent).toBe(true);
    expect(errorActions.props.repairTitle).toBe('使用 AI 修复 SOURCE JSON');

    const validTree = AppSourceCodeEditor(buildAppSourceCodeEditorTestProps({
      sourceValidation: { isValid: true },
    }));
    expect(isElementLike(validTree)).toBe(true);
    if (!isElementLike(validTree)) throw new Error('AppSourceCodeEditor 应返回 React 元素');
    expect(validTree.props.error).toBeUndefined();
    expect(isElementLike(validTree.props.errorActions)).toBe(true);
  });
});
