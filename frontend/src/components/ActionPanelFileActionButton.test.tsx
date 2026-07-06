import { describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { ActionPanelFileActionButton } from './ActionPanelFileActionButton';
import { assertElementLike, collectText } from './componentElementTestHelpers';

const renderButton = (
  overrides: Partial<Parameters<typeof ActionPanelFileActionButton>[0]> = {},
) => ActionPanelFileActionButton({
  action: ActionType.OPEN,
  label: '打开文件',
  icon: <span>O</span>,
  dataTour: 'open-file-button',
  isCollapsed: false,
  onAction: vi.fn(),
  ...overrides,
});

describe('ActionPanelFileActionButton', () => {
  it('展开态展示标签并透传 action 点击', () => {
    const onAction = vi.fn();
    const tree = assertElementLike(
      renderButton({ onAction }),
      'ActionPanelFileActionButton 应返回 React 元素'
    );

    expect(tree.props['data-tour']).toBe('open-file-button');
    expect(tree.props['aria-label']).toBe('打开文件');
    expect(tree.props.title).toBeUndefined();
    expect(collectText(tree)).toContain('打开文件');

    const handleClick = tree.props.onClick;
    expect(typeof handleClick).toBe('function');
    if (typeof handleClick !== 'function') throw new Error('文件操作按钮应透传点击回调');
    handleClick();
    expect(onAction).toHaveBeenCalledWith(ActionType.OPEN);
  });

  it('折叠态隐藏标签并保留 title', () => {
    const tree = assertElementLike(
      renderButton({ isCollapsed: true }),
      'ActionPanelFileActionButton 应返回 React 元素'
    );

    expect(tree.props.title).toBe('打开文件');
    expect(tree.props.className).toContain('px-2');
    expect(collectText(tree)).not.toContain('打开文件');
  });
});
