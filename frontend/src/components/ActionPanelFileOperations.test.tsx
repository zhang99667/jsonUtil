import { describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { ActionPanelAiFixButton } from './ActionPanelAiFixButton';
import { ActionPanelFileActionIcon } from './ActionPanelFileActionIcon';
import { ActionPanelFileActionButton } from './ActionPanelFileActionButton';
import { ActionPanelFileOperations } from './ActionPanelFileOperations';

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

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

describe('ActionPanelFileOperations', () => {
  it('装配打开和保存两个普通文件按钮', () => {
    const onAction = vi.fn();
    const tree = ActionPanelFileOperations({
      isCollapsed: true,
      isProcessing: false,
      onAction,
    });
    const fileButtons = findByType(tree, ActionPanelFileActionButton);

    expect(fileButtons).toHaveLength(2);
    expect(fileButtons[0].props).toMatchObject({
      action: ActionType.OPEN,
      label: '打开文件',
      dataTour: 'open-file-button',
      isCollapsed: true,
      onAction,
    });
    expect(fileButtons[0].props.icon).toMatchObject({
      type: ActionPanelFileActionIcon,
      props: { action: ActionType.OPEN },
    });

    expect(fileButtons[1].props).toMatchObject({
      action: ActionType.SAVE,
      label: '保存为 JSON',
      dataTour: 'save-file-button',
      isCollapsed: true,
      onAction,
    });
    expect(fileButtons[1].props.icon).toMatchObject({
      type: ActionPanelFileActionIcon,
      props: { action: ActionType.SAVE },
    });
  });

  it('按 processing 状态展示 AI 修复按钮', () => {
    const onAction = vi.fn();
    const tree = ActionPanelFileOperations({
      isCollapsed: false,
      isProcessing: true,
      onAction,
    });
    const aiFixButton = findByType(tree, ActionPanelAiFixButton)[0];

    expect(aiFixButton.props).toMatchObject({
      isCollapsed: false,
      isProcessing: true,
      onAction,
    });
  });
});
