import { describe, expect, it, vi } from 'vitest';
import type {
  TransformReportRuntimePlaceholder,
  TransformReportRuntimePlaceholderGroup,
} from '../utils/transformRuntimePlaceholderTypes';
import { TransformReportPlaceholderGroupsList } from './TransformReportPlaceholderGroupsList';
import { TransformReportPlaceholderRow } from './TransformReportPlaceholderRow';
import { TransformReportPlaceholderRowsList } from './TransformReportPlaceholderRowsList';
import { TransformReportPlaceholderToolbar } from './TransformReportPlaceholderToolbar';
import { TransformReportPlaceholdersSection } from './TransformReportPlaceholdersSection';

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

const findByDataTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByDataTour(item, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByDataTour(node.props.children, dataTour));
};

const findByType = (node: unknown, type: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(item => findByType(item, type));
  if (!isElementLike(node)) return [];

  const matches = node.type === type ? [node] : [];
  return matches.concat(findByType(node.props.children, type));
};

const group: TransformReportRuntimePlaceholderGroup = {
  value: '__UID__',
  description: '用户 ID',
  count: 2,
  sourceCount: 1,
  sources: [{
    sourcePath: '$.cmd',
    sourceLabel: 'scheme',
    sourceOriginalPreview: 'cmd=__UID__',
    count: 2,
  }],
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

describe('TransformReportPlaceholdersSection', () => {
  it('渲染占位符区域并转发工具栏、分组、定位和 Scheme 动作', () => {
    const onOpenPlaceholderFillTemplate = vi.fn();
    const onCopyPlaceholderFillTemplate = vi.fn();
    const onCopyPlaceholderReport = vi.fn();
    const onFilter = vi.fn();
    const onCopyPath = vi.fn();
    const onCopyOriginalValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();

    const tree = TransformReportPlaceholdersSection({
      runtimePlaceholderGroups: [group],
      runtimePlaceholders: [placeholder],
      toolbar: {
        filteredPlaceholderCount: 3,
        isPlaceholderTruncated: true,
        canShowOpenTemplateFill: true,
        isPlaceholderFillTemplateDisabled: false,
        isCopyPlaceholderReportDisabled: false,
        openTemplateFillTitle: '填入模板',
        copyTemplateTitle: '复制模板',
        copyPlaceholderReportTitle: '复制摘要',
        onOpenPlaceholderFillTemplate,
        onCopyPlaceholderFillTemplate,
        onCopyPlaceholderReport,
      },
      onFilter,
      rows: {
        onCopyPath,
        onCopyOriginalValue,
        onLocatePath,
        onOpenSchemeValue,
      },
    });

    const toolbars = findByType(tree, TransformReportPlaceholderToolbar);
    expect(toolbars).toHaveLength(1);
    expect(toolbars[0].props.filteredPlaceholderCount).toBe(3);
    expect(toolbars[0].props.visiblePlaceholderCount).toBe(1);
    expect(toolbars[0].props.isPlaceholderTruncated).toBe(true);
    expect(toolbars[0].props.canShowOpenTemplateFill).toBe(true);
    expect(toolbars[0].props.isPlaceholderFillTemplateDisabled).toBe(false);
    expect(toolbars[0].props.isCopyPlaceholderReportDisabled).toBe(false);
    expect(toolbars[0].props.openTemplateFillTitle).toBe('填入模板');
    expect(toolbars[0].props.copyTemplateTitle).toBe('复制模板');
    expect(toolbars[0].props.copyPlaceholderReportTitle).toBe('复制摘要');
    expect(toolbars[0].props.onOpenPlaceholderFillTemplate).toBe(onOpenPlaceholderFillTemplate);
    expect(toolbars[0].props.onCopyPlaceholderFillTemplate).toBe(onCopyPlaceholderFillTemplate);
    expect(toolbars[0].props.onCopyPlaceholderReport).toBe(onCopyPlaceholderReport);
    const placeholderGroups = findByType(tree, TransformReportPlaceholderGroupsList);
    expect(placeholderGroups).toHaveLength(1);
    expect(placeholderGroups[0].props.runtimePlaceholderGroups).toEqual([group]);
    expect(placeholderGroups[0].props.onFilter).toBe(onFilter);
    const placeholderRowsList = findByType(tree, TransformReportPlaceholderRowsList);
    expect(placeholderRowsList).toHaveLength(1);
    expect(placeholderRowsList[0].props.runtimePlaceholders).toEqual([placeholder]);
    expect(placeholderRowsList[0].props.onCopyPath).toBe(onCopyPath);
    expect(placeholderRowsList[0].props.onCopyOriginalValue).toBe(onCopyOriginalValue);
    expect(placeholderRowsList[0].props.onLocatePath).toBe(onLocatePath);
    expect(placeholderRowsList[0].props.onOpenSchemeValue).toBe(onOpenSchemeValue);
  });
});

describe('TransformReportPlaceholderRowsList', () => {
  it('按占位符列表渲染单行组件并透传行级动作', () => {
    const onCopyPath = vi.fn();
    const onCopyOriginalValue = vi.fn();
    const onLocatePath = vi.fn();
    const onOpenSchemeValue = vi.fn();

    const tree = TransformReportPlaceholderRowsList({
      runtimePlaceholders: [placeholder],
      onCopyPath,
      onCopyOriginalValue,
      onLocatePath,
      onOpenSchemeValue,
    });

    const placeholderRows = findByType(tree, TransformReportPlaceholderRow);
    expect(placeholderRows).toHaveLength(1);
    expect(placeholderRows[0].props.placeholder).toBe(placeholder);
    expect(placeholderRows[0].props.onCopyPath).toBe(onCopyPath);
    expect(placeholderRows[0].props.onCopyOriginalValue).toBe(onCopyOriginalValue);
    expect(placeholderRows[0].props.onLocatePath).toBe(onLocatePath);
    expect(placeholderRows[0].props.onOpenSchemeValue).toBe(onOpenSchemeValue);
  });
});

describe('TransformReportPlaceholderToolbar', () => {
  it('渲染占位符摘要并触发模板与复制动作', () => {
    const onOpenPlaceholderFillTemplate = vi.fn();
    const onCopyPlaceholderFillTemplate = vi.fn();
    const onCopyPlaceholderReport = vi.fn();

    const tree = TransformReportPlaceholderToolbar({
      filteredPlaceholderCount: 3,
      visiblePlaceholderCount: 1,
      isPlaceholderTruncated: true,
      canShowOpenTemplateFill: true,
      isPlaceholderFillTemplateDisabled: false,
      isCopyPlaceholderReportDisabled: false,
      openTemplateFillTitle: '填入模板',
      copyTemplateTitle: '复制模板',
      copyPlaceholderReportTitle: '复制摘要',
      onOpenPlaceholderFillTemplate,
      onCopyPlaceholderFillTemplate,
      onCopyPlaceholderReport,
    });

    const text = collectText(tree);
    expect(text).toContain('运行时占位符 · 3');
    expect(text).toContain('仅显示前 1 条');

    (findByDataTour(tree, 'transform-report-open-placeholder-fill-template')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-copy-placeholder-fill-template')[0].props.onClick as () => void)();
    (findByDataTour(tree, 'transform-report-copy-placeholders')[0].props.onClick as () => void)();

    expect(onOpenPlaceholderFillTemplate).toHaveBeenCalledTimes(1);
    expect(onCopyPlaceholderFillTemplate).toHaveBeenCalledTimes(1);
    expect(onCopyPlaceholderReport).toHaveBeenCalledTimes(1);
  });
});
