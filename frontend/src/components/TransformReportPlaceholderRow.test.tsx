import { describe, expect, it, vi } from 'vitest';
import type { TransformReportRuntimePlaceholder } from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderRowActions } from './TransformReportPlaceholderRowActions';
import { SourceLabelBadge } from './TransformReportPanelAtoms';
import { TransformReportPlaceholderRow } from './TransformReportPlaceholderRow';

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

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const placeholder: TransformReportRuntimePlaceholder = {
  path: '$.cmd.uid',
  sourcePath: '$.cmd',
  sourceLabel: 'scheme',
  sourceOriginalValue: 'cmd=__UID__',
  sourceOriginalPreview: 'cmd=__UID__',
  value: '__UID__',
  description: '用户 ID',
};

describe('TransformReportPlaceholderRow', () => {
  it('展示占位符来源并转发动作组件配置', () => {
    const props = {
      placeholder,
      onCopyPath: vi.fn(),
      onCopyOriginalValue: vi.fn(),
      onLocatePath: vi.fn(),
      onOpenSchemeValue: vi.fn(),
    };
    const tree = TransformReportPlaceholderRow(props);
    const text = collectText(tree);

    expect(text).toContain('$.cmd.uid');
    expect(text).toContain('__UID__');
    expect(text).toContain('用户 ID');
    expect(text).toContain('来源: $.cmd');
    expect(text).toContain('来源原始值: cmd=__UID__');
    expect(findByType(tree, SourceLabelBadge)[0].props.label).toBe('scheme');

    const actions = findByType(tree, TransformReportPlaceholderRowActions);
    expect(actions).toHaveLength(1);
    expect(actions[0].props.placeholder).toBe(placeholder);
    expect(actions[0].props.onCopyPath).toBe(props.onCopyPath);
    expect(actions[0].props.onCopyOriginalValue).toBe(props.onCopyOriginalValue);
    expect(actions[0].props.onLocatePath).toBe(props.onLocatePath);
    expect(actions[0].props.onOpenSchemeValue).toBe(props.onOpenSchemeValue);
  });

  it('没有来源原始值时隐藏来源原始值预览', () => {
    const tree = TransformReportPlaceholderRow({
      placeholder: {
        ...placeholder,
        sourceOriginalValue: undefined,
        sourceOriginalPreview: undefined,
      },
      onCopyPath: vi.fn(),
      onCopyOriginalValue: vi.fn(),
    });

    expect(collectText(tree)).not.toContain('来源原始值:');
  });
});
