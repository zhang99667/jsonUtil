import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DraggablePanel } from './DraggablePanel';
import { TemplateFillFooterActions } from './TemplateFillFooterActions';
import { TemplateFillPanel } from './TemplateFillPanel';
import { isElementLike } from './componentElementTestHelpers';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
  useMemo: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
  useMemo: reactMocks.useMemo,
  useState: reactMocks.useState,
}));

const renderFooter = (template: string) => {
  reactMocks.useState.mockReturnValue([template, vi.fn()]);
  const tree = TemplateFillPanel({
    isOpen: true,
    onClose: vi.fn(),
    onApplyTemplate: vi.fn(),
  });

  if (!isElementLike(tree) || tree.type !== DraggablePanel) {
    throw new Error('模板填充面板应直接渲染 DraggablePanel');
  }

  const footer = tree.props.footer;
  if (!isElementLike(footer) || footer.type !== TemplateFillFooterActions) {
    throw new Error('模板填充面板应向 DraggablePanel 传入底部操作栏');
  }
  return footer;
};

describe('TemplateFillPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useEffect.mockImplementation(() => undefined);
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
  });

  it.each([
    ['单个标准 JSON', '{"ok":true}', true],
    ['空模板', '', false],
  ])('%s 保持既有可用态', (_, template, hasTemplateContent) => {
    const footer = renderFooter(template);

    expect(footer.props.isTemplateValid).toBe(true);
    expect(footer.props.hasTemplateContent).toBe(hasTemplateContent);
  });

  it.each([
    ['JSON Lines', '{"a":1}\n{"b":2}'],
    ['脚本包装', 'const response = {"code":0};'],
    ['JSONP 包装', 'callback({"code":0});'],
    ['Markdown 代码块', '```json\n{"code":0}\n```'],
    ['JSONC 注释', '{\n  // 标准 JSON 不允许注释\n  "code": 0\n}'],
    ['JSON5 风格', "{name:'JSONUtils',}"],
  ])('%s 模板会禁用格式化和应用', (_, template) => {
    const footer = renderFooter(template);

    expect(footer.props.hasTemplateContent).toBe(true);
    expect(footer.props.isTemplateValid).toBe(false);
  });
});
