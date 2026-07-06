import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTypeOrNull } from './componentElementTestHelpers';
import { TransformReportEmptyState } from './TransformReportEmptyState';

describe('TransformReportEmptyState', () => {
  it('无筛选时展示默认空态且不展示清空按钮', () => {
    const tree = TransformReportEmptyState({
      query: '',
      onClearFilter: vi.fn(),
    });

    expect(collectText(tree)).toContain('本次深度格式化没有展开嵌套字符串');
    expect(findByTypeOrNull(tree, 'button')).toBeNull();
  });

  it('有筛选时展示匹配空态并转发清空动作', () => {
    const onClearFilter = vi.fn();
    const tree = TransformReportEmptyState({
      query: 'CMD',
      onClearFilter,
    });
    const button = findByTypeOrNull(tree, 'button');

    expect(collectText(tree)).toContain('没有匹配的解析记录');
    expect(button).toBeTruthy();
    if (button) clickElement(button);
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });
});
