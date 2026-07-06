import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultToolbar } from './JsonPathPanelResultToolbar';
import { JsonPathPanelResultToolbarButton } from './JsonPathPanelResultToolbarButton';

const renderToolbar = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultToolbar>[0]> = {}
) => JsonPathPanelResultToolbar({
  currentResultIndex: 1,
  resultCount: 3,
  isResultLimited: false,
  resultLimit: 500,
  isQuerying: false,
  canCopyValues: true,
  canCopyPathValues: true,
  copyButtonLabel: '复制值',
  copyPathValueButtonLabel: '复制路径和值',
  resultStatusId: 'jsonpath-result-status',
  onCopyValues: vi.fn(),
  onCopyPathValues: vi.fn(),
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  ...overrides,
});

describe('JsonPathPanelResultToolbar', () => {
  it('无结果时不渲染工具条', () => {
    expect(renderToolbar({ resultCount: 0 })).toBeNull();
  });

  it('渲染结果状态和四个工具按钮', () => {
    const onCopyValues = vi.fn();
    const onCopyPathValues = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const tree = renderToolbar({
      isResultLimited: true,
      resultLimit: 2,
      onCopyValues,
      onCopyPathValues,
      onPrevious,
      onNext,
    });
    const buttons = findByType(tree, JsonPathPanelResultToolbarButton);

    expect(collectText(tree)).toContain('2 / 3');
    expect(collectText(tree)).toContain('命中超过 2，已提前停止');
    expect(buttons.map(button => button.props.label)).toEqual([
      '复制值',
      '复制路径和值',
      '上一个结果 (Shift+Enter)',
      '下一个结果 (Enter)',
    ]);
    expect(buttons[1].props.dataTour).toBe('jsonpath-copy-path-values');

    buttons.forEach(clickElement);
    expect(onCopyValues).toHaveBeenCalledTimes(1);
    expect(onCopyPathValues).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('查询中禁用所有工具按钮', () => {
    const buttons = findByType(renderToolbar({ isQuerying: true }), JsonPathPanelResultToolbarButton);

    expect(buttons.map(button => button.props.disabled)).toEqual([true, true, true, true]);
  });
});
