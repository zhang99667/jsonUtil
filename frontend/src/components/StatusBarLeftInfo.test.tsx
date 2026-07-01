import { describe, expect, it, vi } from 'vitest';
import type { FileTab } from '../types';
import { StatusBarActiveFileBadge } from './StatusBarActiveFileBadge';
import { StatusBarContentMetrics } from './StatusBarContentMetrics';
import { StatusBarLeftInfo } from './StatusBarLeftInfo';
import { StatusBarSaveStatusBadge } from './StatusBarSaveStatusBadge';
import { StatusBarSourceValidationBadge } from './StatusBarSourceValidationBadge';
import { StatusBarStatusBadges } from './StatusBarStatusBadges';

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

const activeFile: FileTab = {
  id: 'file-1',
  name: 'demo.json',
  content: '{"ok":true}',
  path: '/tmp/demo.json',
  isDirty: true,
};

describe('StatusBarLeftInfo', () => {
  it('展示左侧编码、长度、行列、文件和保存状态', () => {
    const tree = StatusBarLeftInfo({
      activeContentLength: 128,
      byteSizeText: '256 B',
      totalLines: 12,
      maxColumns: 80,
      isStatsLimited: false,
      cursorLine: 3,
      cursorColumn: 9,
      activeFile,
      saveStatus: {
        label: '未保存',
        className: 'bg-yellow-100 text-yellow-800',
        title: '当前文件有未保存修改',
      },
      sourceValidationStatus: {
        label: 'JSON 有效',
        className: 'bg-green-100 text-green-800',
        title: 'SOURCE JSON / JSON Lines 校验通过',
      },
      sourceValidationAction: null,
    });

    const metrics = findByType(tree, StatusBarContentMetrics)[0];
    expect(metrics.props.activeContentLength).toBe(128);
    expect(metrics.props.byteSizeText).toBe('256 B');
    expect(metrics.props.totalLines).toBe(12);
    expect(metrics.props.maxColumns).toBe(80);
    expect(metrics.props.cursorLine).toBe(3);
    expect(metrics.props.cursorColumn).toBe(9);
    const badgeGroup = findByType(tree, StatusBarStatusBadges)[0];
    expect(badgeGroup.props.activeFile).toBe(activeFile);
    expect(badgeGroup.props.saveStatus).toMatchObject({
      label: '未保存',
      className: 'bg-yellow-100 text-yellow-800',
    });
  });

  it('采样统计时展示简化行列并透传 SOURCE 校验动作', () => {
    const onClick = vi.fn();
    const tree = StatusBarLeftInfo({
      activeContentLength: 2048,
      byteSizeText: '≥2.0 KB',
      totalLines: 1000,
      maxColumns: 320,
      isStatsLimited: true,
      activeFile: null,
      saveStatus: {
        label: '空白草稿',
        className: 'bg-white/15 text-white',
        title: '当前没有打开文件',
      },
      sourceValidationStatus: {
        label: 'JSON 无效 L1:C2',
        className: 'bg-red-100 text-red-800',
        title: 'SOURCE JSON 无效: 缺少逗号',
      },
      sourceValidationAction: { type: 'locate', onClick },
    });

    const metrics = findByType(tree, StatusBarContentMetrics)[0];
    expect(metrics.props.isStatsLimited).toBe(true);
    expect(metrics.props.byteSizeText).toBe('≥2.0 KB');

    const badgeGroup = findByType(tree, StatusBarStatusBadges)[0];
    expect(badgeGroup.props.sourceValidationStatus).toMatchObject({ label: 'JSON 无效 L1:C2' });
    expect(badgeGroup.props.sourceValidationAction).toMatchObject({ type: 'locate', onClick });
  });
});

describe('StatusBarStatusBadges', () => {
  it('透传文件、保存和 SOURCE 校验状态到各 badge', () => {
    const onClick = vi.fn();
    const tree = StatusBarStatusBadges({
      activeFile,
      saveStatus: {
        label: '已保存',
        className: 'bg-green-100 text-green-800',
        title: '当前文件已保存',
      },
      sourceValidationStatus: {
        label: 'JSON 无效 L2:C4',
        className: 'bg-red-100 text-red-800',
        title: 'SOURCE JSON 无效: 缺少右括号',
      },
      sourceValidationAction: { type: 'locate', onClick },
    });

    expect(findByType(tree, StatusBarActiveFileBadge)[0].props.activeFile).toBe(activeFile);
    expect(findByType(tree, StatusBarSaveStatusBadge)[0].props.status).toMatchObject({ label: '已保存' });
    expect(findByType(tree, StatusBarSourceValidationBadge)[0].props.action).toMatchObject({ type: 'locate', onClick });
  });
});

describe('StatusBarContentMetrics', () => {
  it('展示编码、长度、字节、光标和完整行列统计', () => {
    const tree = StatusBarContentMetrics({
      activeContentLength: 128,
      byteSizeText: '256 B',
      totalLines: 12,
      maxColumns: 80,
      isStatsLimited: false,
      cursorLine: 3,
      cursorColumn: 9,
    });

    const text = collectText(tree);
    expect(text).toContain('UTF-8');
    expect(text).toContain('Length: 128');
    expect(text).toContain('Size: 256 B');
    expect(text).toContain('Ln 3, Col 9');
    expect(text).toContain('12 行, 80 列');
    expect(findByDataTour(tree, 'statusbar-byte-size')[0].props.title).toBe('当前聚焦内容的 UTF-8 字节数');
  });

  it('采样统计时展示简化行列和大文件字节提示', () => {
    const tree = StatusBarContentMetrics({
      activeContentLength: 2048,
      byteSizeText: '≥2.0 KB',
      totalLines: 1000,
      maxColumns: 320,
      isStatsLimited: true,
    });

    const text = collectText(tree);
    expect(text).toContain('行列统计已简化');
    expect(findByDataTour(tree, 'statusbar-byte-size')[0].props.title).toBe('大文件只估算已扫描内容的 UTF-8 字节数');
  });
});
