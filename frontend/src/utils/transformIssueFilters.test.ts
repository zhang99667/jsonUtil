import { describe, expect, it } from 'vitest';
import {
  matchesReportWarning,
  matchesUnresolvedCandidate,
} from './transformIssueFilters';
import type {
  TransformReportUnresolvedCandidate,
  TransformReportWarning,
} from './transformSummary';

const createWarning = (overrides: Partial<TransformReportWarning> = {}): TransformReportWarning => ({
  type: 'string_decode_skipped',
  path: '$.huge_cmd',
  sourceLabel: 'hugeParam',
  originalValue: 'cmd=%7B%22huge%22%3Atrue%7D&source_tail_needle=1',
  message: '字符串过长，已跳过递归展开',
  length: 120_000,
  limit: 100_000,
  reasonLabel: '性能保护跳过',
  nextAction: '可复制该字段单独解析',
  ...overrides,
});

const createUnresolved = (
  overrides: Partial<TransformReportUnresolvedCandidate> = {}
): TransformReportUnresolvedCandidate => ({
  path: '$.tracking',
  sourceLabel: 'trackingParam',
  originalValue: 'tracking=%7B%22nid%22%3A1%7D&source_tail_needle=1',
  message: 'URL 编码内容已解码，但未展开为结构化对象',
  length: 64,
  preview: 'tracking preview',
  detectedType: 'url-encoded',
  reasonLabel: '已解码但未结构化',
  reasonLevel: 'info',
  nextAction: '确认是否只是普通埋点参数',
  ...overrides,
});

describe('transformIssueFilters', () => {
  it('匹配跳过记录的快捷词、来源标签、原因和后续动作', () => {
    const warning = createWarning();

    expect(matchesReportWarning(warning, '跳过')).toBe(true);
    expect(matchesReportWarning(warning, '待处理')).toBe(true);
    expect(matchesReportWarning(warning, 'hugeparam')).toBe(true);
    expect(matchesReportWarning(warning, '性能保护')).toBe(true);
    expect(matchesReportWarning(warning, '单独解析')).toBe(true);
    expect(matchesReportWarning(warning, 'missing')).toBe(false);
  });

  it('跳过记录仅对长片段或明显编码片段扫描原文', () => {
    const warning = createWarning();

    expect(matchesReportWarning(warning, 'source_tail_needle')).toBe(true);
    expect(matchesReportWarning(warning, 'needle')).toBe(false);
    expect(matchesReportWarning(warning, 'cmd=%7b')).toBe(true);
  });

  it('匹配待检查记录的快捷词、detectedType、预览和建议', () => {
    const unresolved = createUnresolved();

    expect(matchesUnresolvedCandidate(unresolved, '待检查')).toBe(true);
    expect(matchesUnresolvedCandidate(unresolved, 'trackingparam')).toBe(true);
    expect(matchesUnresolvedCandidate(unresolved, 'url-encoded')).toBe(true);
    expect(matchesUnresolvedCandidate(unresolved, 'tracking preview')).toBe(true);
    expect(matchesUnresolvedCandidate(unresolved, '普通埋点')).toBe(true);
    expect(matchesUnresolvedCandidate(unresolved, 'missing')).toBe(false);
  });

  it('待检查记录仅对长片段或明显编码片段扫描原文', () => {
    const unresolved = createUnresolved();

    expect(matchesUnresolvedCandidate(unresolved, 'source_tail_needle')).toBe(true);
    expect(matchesUnresolvedCandidate(unresolved, 'needle')).toBe(false);
    expect(matchesUnresolvedCandidate(unresolved, 'tracking=%7b')).toBe(true);
  });
});
