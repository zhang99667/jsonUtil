import type { TransformReportIssueTriageItem, TransformReportNextActionItem } from './transformReportActionItemTypes';

type IssueTriageStaticConfig = Omit<TransformReportIssueTriageItem, 'count'>;
type NextActionStaticConfig = Omit<TransformReportNextActionItem, 'title' | 'disabled'>;

export const ISSUE_TRIAGE_STATIC_CONFIGS: Record<'warning' | 'unresolved', IssueTriageStaticConfig> = {
  warning: {
    key: 'warning',
    label: '跳过记录',
    description: '先确认超长字段或预算跳过，必要时单独粘贴字段到 Scheme 面板解析。',
    actionLabel: '查看跳过',
    title: '筛选性能保护跳过记录',
    action: 'filter-warning',
  },
  unresolved: {
    key: 'unresolved',
    label: '待检查',
    description: '检查已解码但未结构化的字段，判断是否需要补解析规则或只是普通埋点。',
    actionLabel: '查看待检查',
    title: '筛选未展开线索',
    action: 'filter-unresolved',
  },
};

export const getPlaceholderIssueTriageConfig = (
  canOpenPlaceholderFill: boolean
): IssueTriageStaticConfig => ({
  key: 'placeholder',
  label: '占位符',
  description: '优先回填运行时占位符，再观察 CMD 结构数和覆盖质量是否变化。',
  actionLabel: canOpenPlaceholderFill ? '回填占位符' : '查看占位符',
  title: '',
  action: canOpenPlaceholderFill ? 'open-placeholder-fill' : 'filter-placeholder',
});

export const getPlaceholderNextActionConfig = (
  canOpenPlaceholderFill: boolean
): NextActionStaticConfig => ({
  key: 'placeholder',
  label: canOpenPlaceholderFill ? '回填占位符' : '查看占位符',
  description: canOpenPlaceholderFill
    ? '带入候选值后重新生成质量对比，判断覆盖率和 CMD 结构变化。'
    : '先定位运行时占位符，再确认需要服务端或客户端补哪些值。',
  tone: 'purple',
  action: canOpenPlaceholderFill ? 'open-placeholder-fill' : 'filter-placeholder',
});

export const NEXT_ACTION_STATIC_CONFIGS = {
  compareCmd: {
    key: 'compare-cmd',
    label: '对比 cmdHandler',
    description: '打开当前筛选下的第一条 CMD 结构，粘贴内部解析结果后看差异。',
    title: '打开第一条 CMD 结构的 cmdHandler 对比',
    tone: 'primary',
    action: 'compare-cmd',
  },
  triage: {
    key: 'triage',
    label: '查看待处理',
    description: '聚焦待检查、跳过和占位符，先把影响解析质量的风险收敛。',
    title: '筛选待检查、跳过记录和运行时占位符',
    tone: 'rose',
    action: 'filter-triage',
  },
  archive: {
    key: 'archive',
    label: '复制归档包',
    description: '复制质量快照、脱敏问题样本和 corpus 沉淀清单，不携带原始 response。',
    tone: 'cyan',
    action: 'copy-archive',
  },
  collaboration: {
    key: 'collaboration',
    label: '复制协作报告',
    description: '把诊断摘要、质量要点和 cmdHandler 对齐状态发给协作者。',
    tone: 'cyan',
    action: 'copy-collaboration',
  },
  qualitySnapshot: {
    key: 'quality-snapshot',
    label: '复制质量快照',
    description: '保存不含原始值的结构化质量指标，便于后续趋势对比。',
    tone: 'cyan',
    action: 'copy-quality-snapshot',
  },
} satisfies Record<string, Omit<TransformReportNextActionItem, 'disabled'> | NextActionStaticConfig>;
