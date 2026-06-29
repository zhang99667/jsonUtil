import { describe, expect, it } from 'vitest';
import {
  ISSUE_TRIAGE_STATIC_CONFIGS,
  NEXT_ACTION_STATIC_CONFIGS,
  getPlaceholderIssueTriageConfig,
  getPlaceholderNextActionConfig,
} from './transformReportActionItemConfig';

describe('transformReportActionItemConfig', () => {
  it('保留跳过和待检查优先处理项静态文案', () => {
    expect(ISSUE_TRIAGE_STATIC_CONFIGS.warning).toMatchObject({
      label: '跳过记录',
      actionLabel: '查看跳过',
      action: 'filter-warning',
    });
    expect(ISSUE_TRIAGE_STATIC_CONFIGS.unresolved).toMatchObject({
      label: '待检查',
      actionLabel: '查看待检查',
      action: 'filter-unresolved',
    });
  });

  it('根据占位符回填能力切换优先处理项动作', () => {
    expect(getPlaceholderIssueTriageConfig(true)).toMatchObject({
      actionLabel: '回填占位符',
      action: 'open-placeholder-fill',
    });
    expect(getPlaceholderIssueTriageConfig(false)).toMatchObject({
      actionLabel: '查看占位符',
      action: 'filter-placeholder',
    });
  });

  it('根据占位符回填能力切换下一步动作文案', () => {
    expect(getPlaceholderNextActionConfig(true)).toMatchObject({
      label: '回填占位符',
      action: 'open-placeholder-fill',
      tone: 'purple',
    });
    expect(getPlaceholderNextActionConfig(false)).toMatchObject({
      label: '查看占位符',
      action: 'filter-placeholder',
      tone: 'purple',
    });
  });

  it('保留归档和质量快照静态动作配置', () => {
    expect(NEXT_ACTION_STATIC_CONFIGS.archive).toMatchObject({
      label: '复制归档包',
      action: 'copy-archive',
      tone: 'cyan',
    });
    expect(NEXT_ACTION_STATIC_CONFIGS.qualitySnapshot).toMatchObject({
      label: '复制质量快照',
      action: 'copy-quality-snapshot',
      tone: 'cyan',
    });
  });
});
