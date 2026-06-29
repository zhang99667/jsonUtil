import type {
  TransformReportFooterActionId,
  TransformReportFooterActionState,
} from './transformReportFooterActionTypes';
import type { TransformReportCopyTitles } from './transformReportCopyTitles';
import type { ReportFooterActionTone } from './transformReportPanelStyles';

type TransformReportFooterTitleKey = keyof TransformReportCopyTitles;
type TransformReportFooterAvailabilityKey =
  | 'hasPathValueCopyItems'
  | 'hasIssueSampleCopyText'
  | 'hasIssueSampleJsonCopyText'
  | 'hasRedactedIssueSampleJsonCopyText'
  | 'hasIssueRegressionTemplateCopyText'
  | 'hasActiveContext';

export interface ConfiguredFooterAction {
  id: TransformReportFooterActionId;
  dataTour: string;
  label: string;
  titleKey: TransformReportFooterTitleKey;
  tone: ReportFooterActionTone;
  ariaPrefix?: string;
  availabilityKey?: TransformReportFooterAvailabilityKey;
  disableWithFilter?: boolean;
}

export const HEADER_FOOTER_ACTIONS: ConfiguredFooterAction[] = [
  { id: 'copy-collaboration-report', dataTour: 'transform-report-copy-collaboration-report', label: '复制排查报告', titleKey: 'collaborationReport', tone: 'cyan' },
  { id: 'copy-diagnostic-summary', dataTour: 'transform-report-copy-diagnostic-summary', label: '复制诊断摘要', titleKey: 'diagnosticSummary', tone: 'neutral' },
  { id: 'copy-quality-snapshot', dataTour: 'transform-report-copy-quality-snapshot', label: '复制质量快照', titleKey: 'qualitySnapshot', tone: 'neutral' },
];

export const BODY_FOOTER_ACTIONS: ConfiguredFooterAction[] = [
  { id: 'copy-archive-package', dataTour: 'transform-report-copy-archive-package', label: '复制归档包', titleKey: 'archivePackage', tone: 'cyan' },
  { id: 'copy-troubleshooting-recipe', dataTour: 'transform-report-copy-troubleshooting-recipe', label: '复制 recipe', titleKey: 'troubleshootingRecipe', tone: 'muted', ariaPrefix: '复制排查 recipe' },
  { id: 'copy-path-values', dataTour: 'transform-report-copy-path-values', label: '复制路径值', titleKey: 'pathValues', tone: 'neutral', availabilityKey: 'hasPathValueCopyItems' },
];

export const TAIL_FOOTER_ACTIONS: ConfiguredFooterAction[] = [
  { id: 'copy-issue-samples', dataTour: 'transform-report-copy-issue-samples', label: '复制问题样本', titleKey: 'issueSamples', tone: 'neutral', availabilityKey: 'hasIssueSampleCopyText' },
  { id: 'copy-issue-sample-json', dataTour: 'transform-report-copy-issue-sample-json', label: '复制样本 JSON', titleKey: 'issueSampleJson', tone: 'neutral', availabilityKey: 'hasIssueSampleJsonCopyText' },
  { id: 'copy-redacted-issue-sample-json', dataTour: 'transform-report-copy-redacted-issue-sample-json', label: '复制脱敏 JSON', titleKey: 'redactedIssueSampleJson', tone: 'neutral', availabilityKey: 'hasRedactedIssueSampleJsonCopyText' },
  { id: 'copy-issue-regression-template', dataTour: 'transform-report-copy-issue-regression-template', label: '复制回归模板', titleKey: 'issueRegressionTemplate', tone: 'neutral', availabilityKey: 'hasIssueRegressionTemplateCopyText' },
  { id: 'copy-full-report', dataTour: 'transform-report-copy-full-report', label: '复制报告', titleKey: 'fullReport', tone: 'neutral', availabilityKey: 'hasActiveContext', disableWithFilter: false },
];

export const isConfiguredActionDisabled = (
  state: TransformReportFooterActionState,
  config: ConfiguredFooterAction,
  reportCopyDisabled: boolean
): boolean => {
  if (!config.availabilityKey) return reportCopyDisabled;

  return !state[config.availabilityKey] || (config.disableWithFilter !== false && state.isFilterPending);
};
