import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { TemplateFillFooterActions } from './TemplateFillFooterActions';

const renderFooterActions = (overrides: Partial<Parameters<typeof TemplateFillFooterActions>[0]> = {}) => {
  const props = {
    hasTemplateContent: true,
    isTemplateValid: true,
    onClear: vi.fn(),
    onFormatTemplate: vi.fn(),
    onApply: vi.fn(),
    ...overrides,
  };

  return {
    props,
    tree: TemplateFillFooterActions(props),
  };
};

describe('TemplateFillFooterActions', () => {
  it('渲染底部按钮并透传可用态点击', () => {
    const { props, tree } = renderFooterActions();
    const clearButtons = findByTour(tree, 'template-clear-button');
    const formatButtons = findByTour(tree, 'template-format-button');
    const applyButtons = findByTour(tree, 'template-apply-button');

    expect(collectText(tree)).toContain('清空模板');
    expect(collectText(tree)).toContain('格式化模板');
    expect(collectText(tree)).toContain('应用模板到当前 JSON');
    expect(clearButtons[0].props).toMatchObject({
      disabled: false,
      title: '清空当前模板内容',
      'aria-label': '清空模板，清空当前模板内容',
    });
    expect(formatButtons[0].props).toMatchObject({
      disabled: false,
      title: '格式化模板 JSON',
      'aria-label': '格式化模板，格式化模板 JSON',
    });
    expect(applyButtons[0].props).toMatchObject({
      disabled: false,
      title: '应用模板到 SOURCE',
      'aria-label': '应用模板到当前 JSON，应用模板到 SOURCE',
    });

    clickElement(clearButtons[0]);
    clickElement(formatButtons[0]);
    clickElement(applyButtons[0]);

    expect(props.onClear).toHaveBeenCalledTimes(1);
    expect(props.onFormatTemplate).toHaveBeenCalledTimes(1);
    expect(props.onApply).toHaveBeenCalledTimes(1);
  });

  it('空模板时禁用三类操作并展示空态提示', () => {
    const { tree } = renderFooterActions({ hasTemplateContent: false });
    const clearButton = findByTour(tree, 'template-clear-button')[0];
    const formatButton = findByTour(tree, 'template-format-button')[0];
    const applyButton = findByTour(tree, 'template-apply-button')[0];

    expect(clearButton.props).toMatchObject({
      disabled: true,
      title: '模板为空，暂无内容可清空',
    });
    expect(formatButton.props).toMatchObject({
      disabled: true,
      title: '模板为空，暂无内容可格式化',
    });
    expect(applyButton.props).toMatchObject({
      disabled: true,
      title: '模板为空，暂无内容可应用',
    });
  });

  it('模板非法或 SOURCE 有错误时禁用对应操作', () => {
    const invalidTree = renderFooterActions({ isTemplateValid: false }).tree;
    const targetErrorTree = renderFooterActions({ targetError: 'SOURCE 不是合法 JSON' }).tree;

    expect(findByTour(invalidTree, 'template-format-button')[0].props).toMatchObject({
      disabled: true,
      title: '请先修正模板 JSON 后再格式化',
    });
    expect(findByTour(invalidTree, 'template-apply-button')[0].props).toMatchObject({
      disabled: true,
      title: '请先修正模板 JSON 后再应用',
    });
    expect(findByTour(targetErrorTree, 'template-apply-button')[0].props).toMatchObject({
      disabled: true,
      title: 'SOURCE 不是合法 JSON',
      'aria-label': '应用模板到当前 JSON，SOURCE 不是合法 JSON',
    });
  });
});
