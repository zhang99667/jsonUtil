import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import type { LocalProcessingStatus } from '../utils/localProcessingStatus';
import { StatusBarLocalProcessingBadge } from './StatusBarLocalProcessingBadge';
import { StatusBarModeBadge } from './StatusBarModeBadge';
import { StatusBarViewStatus } from './StatusBarViewStatus';
import { StatusBarVersionBadge } from './StatusBarVersionBadge';
import { collectText, findByType } from './componentElementTestHelpers';

const localProcessingStatus: LocalProcessingStatus = {
  label: '本地 Worker',
  title: '正在本地 Worker 中处理',
  tone: 'worker',
};

describe('StatusBarViewStatus', () => {
  it('展示本地处理状态、视图模式和版本按钮', () => {
    const onOpenChangelog = vi.fn();
    const tree = StatusBarViewStatus({
      localProcessingStatus,
      mode: TransformMode.DEEP_FORMAT,
      onOpenChangelog,
    });

    const localBadges = findByType(tree, StatusBarLocalProcessingBadge);
    expect(localBadges).toHaveLength(1);
    expect(localBadges[0].props.localProcessingStatus).toBe(localProcessingStatus);

    const modeBadges = findByType(tree, StatusBarModeBadge);
    expect(modeBadges).toHaveLength(1);
    expect(modeBadges[0].props.mode).toBe(TransformMode.DEEP_FORMAT);

    const versionBadges = findByType(tree, StatusBarVersionBadge);
    expect(versionBadges).toHaveLength(1);
    expect(versionBadges[0].props.onOpenChangelog).toBe(onOpenChangelog);
  });

  it('没有更新日志入口时渲染不可点击版本标识', () => {
    const tree = StatusBarViewStatus({
      localProcessingStatus: {
        label: '本地处理',
        title: '本地执行',
        tone: 'local',
      },
      mode: TransformMode.FORMAT,
    });

    expect(findByType(tree, StatusBarModeBadge)[0].props.mode).toBe(TransformMode.FORMAT);
    expect(findByType(tree, StatusBarVersionBadge)[0].props.onOpenChangelog).toBeUndefined();
  });
});

describe('StatusBarLocalProcessingBadge', () => {
  it('按本地处理 tone 展示状态样式和 title', () => {
    const tree = StatusBarLocalProcessingBadge({ localProcessingStatus });

    expect(collectText(tree)).toBe('本地 Worker');
    expect(tree.props['data-tour']).toBe('local-processing-status');
    expect(tree.props.className).toContain('bg-cyan-100');
    expect(tree.props.title).toBe('正在本地 Worker 中处理');
  });
});

describe('StatusBarModeBadge', () => {
  it('只展示视图模式本身和嵌套展开说明', () => {
    const tree = StatusBarModeBadge({ mode: TransformMode.DEEP_FORMAT });
    const text = collectText(tree);

    expect(text).not.toContain('当前视图:');
    expect(text).toContain('深度格式化');
    expect(text).toContain('自动展开多层嵌套的 JSON 字符串');
  });
});
