import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { JsonValue, TransformContext } from '../types';
import { APP_VERSION_METADATA } from '../utils/appVersion';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { formatByteSize, getDocumentStats } from '../utils/documentStats';
import {
  collectActualCmdStructureCandidates,
  countCmdStructurePathBranches,
  diffCmdStructures,
  formatCmdStructureDiff,
  hasRecognizableCmdStructure,
  parseCmdStructureJson,
  rankCmdStructureCandidates,
  type CmdStructureCandidateInput,
  type RankedCmdStructureCandidate,
} from '../utils/cmdStructureDiff';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformCmdStructureReportText,
  formatTransformCmdStructureComparisonPackageText,
  formatTransformArchivePackageJsonText,
  formatTransformContextReportText,
  formatTransformCollaborationReportText,
  formatTransformDiagnosticSummaryText,
  formatTransformIssueRegressionTemplateText,
  formatTransformIssueSampleJsonText,
  formatTransformIssueSampleReportText,
  formatTransformPathValueReportText,
  formatTransformPlaceholderReportText,
  buildTransformQualitySnapshot,
  formatTransformQualitySnapshotDeltaText,
  formatTransformQualitySnapshotJsonText,
  formatTransformReportViewText,
  formatTransformTroubleshootingRecipeJsonText,
  buildTransformPlaceholderFillTemplate,
  getTransformDecodedPathCopyText,
  getTransformPathValueCopyRows,
  getTransformRecordCmdStructureCopyText,
} from '../utils/transformSummary';
import type {
  TransformPlaceholderFillTemplate,
  TransformQualitySnapshot,
  TransformReportRecord,
} from '../utils/transformSummary';
import {
  getSourceLabelDisplayValue,
  getSourceLabelKindText,
  isHarSourceLabel,
} from '../utils/sourceLabels';
import { DraggablePanel, PanelIcons } from './DraggablePanel';

interface TransformReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: TransformContext | null;
  onLocatePath?: (path: string) => void;
  onOpenSchemeValue?: (value: string) => void;
  onOpenTemplateFill?: (template: string) => void;
}

interface CmdComparisonCandidateInput extends CmdStructureCandidateInput {
  recordPath: string;
}

interface RankedCmdComparisonCandidate extends RankedCmdStructureCandidate {
  actual: JsonValue;
  recordPath: string;
}

type ReportNextActionTone = 'primary' | 'purple' | 'rose' | 'cyan';

interface ReportNextAction {
  key: string;
  label: string;
  description: string;
  title: string;
  tone: ReportNextActionTone;
  disabled?: boolean;
  onClick: () => void;
}

const SourceLabelBadge: React.FC<{ label?: string }> = ({ label }) => {
  if (!label) return null;

  const isHarLabel = isHarSourceLabel(label);
  const displayValue = getSourceLabelDisplayValue(label);
  const title = `${getSourceLabelKindText(label)}: ${displayValue}`;

  return (
    <span
      className={`max-w-[160px] shrink-0 truncate rounded px-2 py-0.5 ${
        isHarLabel
          ? 'bg-teal-900/40 text-teal-100'
          : 'bg-cyan-900/40 text-cyan-200'
      }`}
      title={title}
    >
      {isHarLabel ? `接口 · ${displayValue}` : displayValue}
    </span>
  );
};

const getCoverageClassName = (level: 'success' | 'info' | 'warning'): string => {
  if (level === 'success') return 'border-emerald-700/50 bg-emerald-900/20 text-emerald-100';
  if (level === 'warning') return 'border-amber-700/50 bg-amber-900/20 text-amber-100';
  return 'border-sky-700/50 bg-sky-900/20 text-sky-100';
};

const getNextActionClassName = (tone: ReportNextActionTone): string => {
  const baseClassName = 'rounded border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  if (tone === 'primary') return `${baseClassName} border-teal-700/70 bg-teal-950/35 text-teal-100 hover:bg-teal-900/55`;
  if (tone === 'purple') return `${baseClassName} border-violet-700/70 bg-violet-950/35 text-violet-100 hover:bg-violet-900/55`;
  if (tone === 'rose') return `${baseClassName} border-rose-700/70 bg-rose-950/30 text-rose-100 hover:bg-rose-900/50`;
  return `${baseClassName} border-cyan-800/70 bg-cyan-950/30 text-cyan-100 hover:bg-cyan-900/50`;
};

const formatDecodedPathCount = (record: TransformReportRecord): string => (
  record.isDecodedPathCountTruncated ? `${record.decodedPathCount}+` : String(record.decodedPathCount)
);

const formatCopySizeLabel = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

const formatCopySuccessMessage = (label: string, content: string): string => (
  `已复制${label}（${formatCopySizeLabel(content)}）`
);

const assertRecognizableCmdComparisonExpected = (value: ReturnType<typeof parseCmdStructureJson>) => {
  if (!hasRecognizableCmdStructure(value)) {
    throw new Error('cmdHandler 输出未识别到 CMD 结构，请粘贴解析后的 result、树形文本或包含主 CMD 字段的 response');
  }
};

const getPathValueCopyRowCount = (records: TransformReportRecord[]): number => (
  records.reduce((count, record) => count + getTransformPathValueCopyRows(record).length, 0)
);

const isPathValueCopyLimited = (records: TransformReportRecord[], isRecordTruncated: boolean): boolean => (
  isRecordTruncated || records.some(record => {
    const copiedRowCount = getTransformPathValueCopyRows(record).length;
    return record.indexedDecodedPathCount > copiedRowCount || record.decodedPathCount > copiedRowCount;
  })
);

const formatPathValueCopyCountLabel = (count: number, isLimited: boolean): string => (
  isLimited ? `已返回 ${count} 项` : `${count} 项`
);

const formatCmdPathCountSummary = (label: string, paths: string[]): string => {
  const branchCount = countCmdStructurePathBranches(paths);
  return branchCount < paths.length
    ? `${label}分支 ${branchCount}`
    : `${label} ${paths.length}`;
};

const formatCmdCandidateSummary = (candidate: RankedCmdStructureCandidate): string => {
  const { diff } = candidate;
  if (!diff.hasDifferences) {
    return `结构一致${diff.ignoredExtraPaths.length ? `，${formatCmdPathCountSummary('已忽略', diff.ignoredExtraPaths)}` : ''}`;
  }

  return [
    `Schema ${diff.schemaDiff ? 1 : 0}`,
    `Source ${diff.sourceDiff ? 1 : 0}`,
    formatCmdPathCountSummary('缺失', diff.missingPaths),
    formatCmdPathCountSummary('额外', diff.extraPaths),
    `值 ${diff.valueDiffs.length}`,
    ...(diff.ignoredExtraPaths.length ? [formatCmdPathCountSummary('已忽略', diff.ignoredExtraPaths)] : []),
  ].join('，');
};

const rebaseCmdStructureCandidatePath = (recordPath: string, candidatePath: string): string => {
  if (candidatePath === '$' || candidatePath === '$.result') return recordPath;
  if (candidatePath.startsWith('$.result.cmdParams')) {
    return `${recordPath}.cmdParams${candidatePath.slice('$.result.cmdParams'.length)}`;
  }
  if (candidatePath.startsWith('$.cmdParams')) {
    return `${recordPath}.cmdParams${candidatePath.slice('$.cmdParams'.length)}`;
  }
  if (candidatePath.startsWith('$.result')) {
    return `${recordPath}${candidatePath.slice('$.result'.length)}`;
  }
  if (candidatePath.startsWith('$')) return `${recordPath}${candidatePath.slice(1)}`;
  return `${recordPath}.${candidatePath}`;
};

const getDecodedPathSchemeInput = (row: TransformReportRecord['nestedCommandFields'][number]): string => {
  if (!Object.prototype.hasOwnProperty.call(row, 'value')) return '';

  if (typeof row.value === 'string') return row.value;

  try {
    return JSON.stringify(row.value, null, 2);
  } catch {
    return '';
  }
};

const COMMAND_SCHEMA_ROW_DISPLAY_LIMIT = 8;

interface SummaryMetricChipProps {
  label: string;
  count: number;
  query: string;
  dataTour: string;
  title: string;
  onFilter: (query: string) => void;
}

const SummaryMetricChip: React.FC<SummaryMetricChipProps> = ({
  label,
  count,
  query,
  dataTour,
  title,
  onFilter,
}) => {
  const className = count > 0
    ? 'bg-editor-bg text-gray-300 px-2 py-0.5 rounded hover:bg-editor-active hover:text-cyan-100 transition-colors'
    : 'bg-editor-bg text-gray-300 px-2 py-0.5 rounded';

  if (count <= 0) {
    return (
      <span className={className}>
        {label} {count}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-tour={dataTour}
      onClick={() => onFilter(query)}
      className={className}
      title={title}
    >
      {label} {count}
    </button>
  );
};

interface PlaceholderFillSummary {
  total: number;
  filled: number;
  suggested: number;
  pending: number;
}

const buildPlaceholderFillSummary = (
  template: TransformPlaceholderFillTemplate | null
): PlaceholderFillSummary | null => {
  if (!template || template.placeholderDetails.length === 0) return null;

  const filled = template.placeholderDetails.filter(detail => detail.replacement.trim().length > 0).length;
  const suggested = template.placeholderDetails.filter(detail => Boolean(detail.suggestion)).length;
  const total = template.placeholderDetails.length;

  return {
    total,
    filled,
    suggested,
    pending: Math.max(total - filled, 0),
  };
};

const formatPlaceholderFillTitle = (baseTitle: string, summary: PlaceholderFillSummary | null): string => {
  if (!summary) return baseTitle;

  const parts = [
    `已预填 ${summary.filled}/${summary.total}`,
    `候选 ${summary.suggested}`,
    `待补 ${summary.pending}`,
  ];
  return `${baseTitle}（${parts.join('，')}）`;
};

export const TransformReportPanel: React.FC<TransformReportPanelProps> = ({
  isOpen,
  onClose,
  context,
  onLocatePath,
  onOpenSchemeValue,
  onOpenTemplateFill,
}) => {
  const [query, setQuery] = useState('');
  const [cmdComparisonRecordPath, setCmdComparisonRecordPath] = useState<string | null>(null);
  const [cmdComparisonActualCandidate, setCmdComparisonActualCandidate] = useState<CmdComparisonCandidateInput | null>(null);
  const [cmdComparisonExpectedText, setCmdComparisonExpectedText] = useState('');
  const [cmdComparisonIgnoreExtraPaths, setCmdComparisonIgnoreExtraPaths] = useState(false);
  const [qualityBaseline, setQualityBaseline] = useState<{
    snapshot: TransformQualitySnapshot;
    filter: string;
  } | null>(null);
  const deferredQuery = useDeferredValue(query);
  const isFilterPending = query !== deferredQuery;
  const activeContext = isOpen ? context : null;
  const report = useMemo(() => (
    activeContext ? buildTransformContextReport(activeContext) : null
  ), [activeContext]);
  const reportContextTimestamp = activeContext?.timestamp ?? 0;

  useEffect(() => {
    setQuery('');
    setCmdComparisonRecordPath(null);
    setCmdComparisonActualCandidate(null);
    setCmdComparisonExpectedText('');
    setCmdComparisonIgnoreExtraPaths(false);
  }, [reportContextTimestamp]);

  const reportView = useMemo(() => (
    report ? buildTransformReportView(report, deferredQuery) : null
  ), [report, deferredQuery]);
  const fullReportView = useMemo(() => (
    report ? buildTransformReportView(report, '') : null
  ), [report]);
  const hasPathValueCopyItems = useMemo(() => (
    Boolean(reportView?.records.some(record => (
      getTransformPathValueCopyRows(record).length > 0
    )))
  ), [reportView]);
  const hasCmdStructureCopyItems = useMemo(() => (
    Boolean(reportView && reportView.filteredCmdStructureCount > 0)
  ), [reportView]);
  const hasFocusedCmdStructureCopyItems = useMemo(() => (
    Boolean(reportView?.cmdStructureRecords.some(record => record.cmdStructureFocusPaths?.length))
  ), [reportView]);
  const issueSampleCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleReportText(reportView, deferredQuery) : ''
  ), [deferredQuery, reportView]);
  const issueSampleJsonCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleJsonText(reportView, { filter: deferredQuery }) : ''
  ), [deferredQuery, reportView]);
  const redactedIssueSampleJsonCopyText = useMemo(() => (
    reportView ? formatTransformIssueSampleJsonText(reportView, {
      redactSensitiveValues: true,
      filter: deferredQuery,
    }) : ''
  ), [deferredQuery, reportView]);
  const issueRegressionTemplateCopyText = useMemo(() => (
    reportView ? formatTransformIssueRegressionTemplateText(reportView, {
      redactSensitiveValues: true,
      filter: deferredQuery,
    }) : ''
  ), [deferredQuery, reportView]);
  const placeholderFillTemplate = useMemo(() => (
    reportView
      ? buildTransformPlaceholderFillTemplate(reportView, deferredQuery, fullReportView || reportView)
      : null
  ), [deferredQuery, fullReportView, reportView]);
  const placeholderFillTemplateSummary = useMemo(() => (
    buildPlaceholderFillSummary(placeholderFillTemplate)
  ), [placeholderFillTemplate]);
  const placeholderFillTemplateJsonText = useMemo(() => (
    placeholderFillTemplate ? JSON.stringify(placeholderFillTemplate, null, 2) : ''
  ), [placeholderFillTemplate]);
  const qualitySnapshot = useMemo(() => (
    report && reportView ? buildTransformQualitySnapshot(report, reportView, deferredQuery) : null
  ), [deferredQuery, report, reportView]);
  const qualityBaselineDeltaText = useMemo(() => (
    qualityBaseline && qualitySnapshot
      ? formatTransformQualitySnapshotDeltaText(qualityBaseline.snapshot, qualitySnapshot)
      : ''
  ), [qualityBaseline, qualitySnapshot]);
  const getReportCopyTitle = (
    canCopy: boolean,
    readyTitle: string,
    unavailableTitle: string
  ): string => {
    if (isFilterPending) return '筛选结果仍在更新，请稍后复制';
    if (!reportView) return '暂无深度解析报告可复制';
    if (!canCopy) return unavailableTitle;
    return readyTitle;
  };
  const getPlaceholderFillTemplateTitle = (readyTitle: string): string => {
    if (isFilterPending) return '筛选结果仍在更新，请稍后操作占位符回填模板';
    if (!placeholderFillTemplateJsonText) return '当前筛选没有可用的运行时占位符回填模板';
    return formatPlaceholderFillTitle(readyTitle, placeholderFillTemplateSummary);
  };
  const filteredReportCopyTitle = getReportCopyTitle(Boolean(reportView), '复制当前筛选命中的深度解析记录', '暂无筛选结果可复制');
  const collaborationReportCopyTitle = getReportCopyTitle(Boolean(reportView), '复制诊断摘要、质量快照要点和 cmdHandler 对齐状态，便于发给协作者排查', '暂无排查报告可复制');
  const diagnosticSummaryCopyTitle = getReportCopyTitle(Boolean(reportView), '复制不含原始大字段值的解析覆盖、CMD Schema 和风险摘要', '暂无诊断摘要可复制');
  const qualitySnapshotCopyTitle = getReportCopyTitle(Boolean(reportView), '复制不含原始大字段值的解析质量指标 JSON，便于保存基线或对比趋势', '暂无质量快照可复制');
  const qualityBaselineCopyTitle = getReportCopyTitle(Boolean(qualityBaselineDeltaText), '复制当前质量快照与临时基线的指标变化', '请先设为基线后再复制质量对比');
  const archivePackageCopyTitle = getReportCopyTitle(Boolean(reportView), '复制不含原始 response 的质量快照、脱敏问题样本和 corpus 沉淀清单', '暂无归档包可复制');
  const troubleshootingRecipeCopyTitle = getReportCopyTitle(Boolean(reportView), '复制不含原始 response 的可复用排查 recipe，便于按步骤复现当前分析链路', '暂无排查 recipe 可复制');
  const pathValuesCopyTitle = getReportCopyTitle(hasPathValueCopyItems, '复制当前筛选下已索引的内部路径和值', '当前筛选没有可复制的路径和值');
  const cmdStructuresCopyTitle = getReportCopyTitle(
    hasCmdStructureCopyItems,
    hasFocusedCmdStructureCopyItems ? '复制按当前筛选聚焦后的 cmdHandler 风格 CMD 结构' : '复制当前展示的 cmdHandler 风格 CMD 结构',
    '当前筛选没有可复制的 CMD 结构'
  );
  const issueSamplesCopyTitle = getReportCopyTitle(Boolean(issueSampleCopyText), '复制当前筛选下的待检查、跳过和占位符来源样本', '当前筛选没有待检查、跳过或占位符来源样本可复制');
  const issueSampleJsonCopyTitle = getReportCopyTitle(Boolean(issueSampleJsonCopyText), '复制当前筛选下可沉淀为回归用例的结构化样本 JSON', '当前筛选没有可沉淀为回归用例的结构化样本');
  const redactedIssueSampleJsonCopyTitle = getReportCopyTitle(Boolean(redactedIssueSampleJsonCopyText), '复制当前筛选下的脱敏结构化样本 JSON，便于安全沉淀回归用例', '当前筛选没有可脱敏沉淀的结构化样本');
  const issueRegressionTemplateCopyTitle = getReportCopyTitle(Boolean(issueRegressionTemplateCopyText), '复制当前筛选下的脱敏 Vitest TODO 回归模板', '当前筛选没有可生成回归模板的问题样本');
  const fullReportCopyTitle = activeContext ? '复制完整深度解析报告' : '暂无深度解析报告可复制';
  const issuePriorityCount = report
    ? report.summary.unresolvedCount + report.summary.warningCount + report.summary.placeholderCount
    : 0;

  const showCopyError = (message: string, error: unknown) => {
    console.warn(message, error);
    toast.error(getClipboardErrorMessage(error), { duration: 2000 });
  };

  const handleCopyReport = async () => {
    if (!activeContext) return;

    try {
      const reportText = formatTransformContextReportText(activeContext);
      await copyText(reportText);
      toast.success(formatCopySuccessMessage('解析报告', reportText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析报告失败:', error);
    }
  };

  const handleCopyFilteredReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const filteredReportText = formatTransformReportViewText(report, reportView, deferredQuery);
      await copyText(filteredReportText);
      toast.success(formatCopySuccessMessage('筛选结果', filteredReportText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析筛选结果失败:', error);
    }
  };

  const handleCopyDiagnosticSummary = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const diagnosticSummaryText = formatTransformDiagnosticSummaryText(report, reportView, deferredQuery);
      await copyText(diagnosticSummaryText);
      toast.success(formatCopySuccessMessage('诊断摘要', diagnosticSummaryText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析诊断摘要失败:', error);
    }
  };

  const handleCopyQualitySnapshot = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const qualitySnapshotText = formatTransformQualitySnapshotJsonText(report, reportView, deferredQuery);
      await copyText(qualitySnapshotText);
      toast.success(formatCopySuccessMessage('质量快照', qualitySnapshotText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析质量快照失败:', error);
    }
  };

  const handleSetQualityBaseline = () => {
    if (!qualitySnapshot || isFilterPending) return;

    setQualityBaseline({
      snapshot: qualitySnapshot,
      filter: deferredQuery.trim() || '全部',
    });
    toast.success('已设为临时质量基线', { duration: 1600 });
  };

  const handleCopyQualityBaselineDelta = async () => {
    if (!qualityBaselineDeltaText || isFilterPending) return;

    try {
      await copyText(qualityBaselineDeltaText);
      toast.success(formatCopySuccessMessage('质量对比', qualityBaselineDeltaText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析质量对比失败:', error);
    }
  };

  const handleClearQualityBaseline = () => {
    setQualityBaseline(null);
    toast.success('临时质量基线已清除', { duration: 1600 });
  };

  const handleCopyArchivePackage = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const archivePackageText = formatTransformArchivePackageJsonText(report, reportView, deferredQuery, {
        cmdComparisonReportText: buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: buildActiveCmdComparisonCandidateText(),
      });
      await copyText(archivePackageText);
      toast.success(formatCopySuccessMessage('归档包', archivePackageText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析归档包失败:', error);
    }
  };

  const handleCopyTroubleshootingRecipe = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const recipeText = formatTransformTroubleshootingRecipeJsonText(report, reportView, deferredQuery);
      await copyText(recipeText);
      toast.success(formatCopySuccessMessage('排查 recipe', recipeText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析排查 recipe 失败:', error);
    }
  };

  const handleCopyPathValueReport = async () => {
    if (!reportView || !hasPathValueCopyItems || isFilterPending) return;

    try {
      const pathValueCopyText = formatTransformPathValueReportText(reportView);
      if (!pathValueCopyText) return;

      await copyText(pathValueCopyText);
      toast.success(`已复制路径和值（${formatPathValueCopyCountLabel(
        getPathValueCopyRowCount(reportView.records),
        isPathValueCopyLimited(reportView.records, reportView.isRecordTruncated)
      )}）`, { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析路径和值失败:', error);
    }
  };

  const handleCopyCmdStructureReport = async () => {
    if (!report || !reportView || !hasCmdStructureCopyItems || isFilterPending) return;

    try {
      const cmdStructureCopyText = formatTransformCmdStructureReportText(report, reportView, deferredQuery);
      if (!cmdStructureCopyText) return;

      await copyText(cmdStructureCopyText);
      toast.success(hasFocusedCmdStructureCopyItems ? '已复制聚焦 CMD 结构列表' : '已复制 CMD 结构列表', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 结构列表失败:', error);
    }
  };

  const handleCopyPlaceholderReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      await copyText(formatTransformPlaceholderReportText(report, reportView, deferredQuery));
      toast.success(deferredQuery.trim() ? '已复制筛选占位符' : '已复制占位符摘要', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析占位符失败:', error);
    }
  };

  const handleCopyPlaceholderFillTemplate = async () => {
    if (!placeholderFillTemplateJsonText || isFilterPending) return;

    try {
      await copyText(placeholderFillTemplateJsonText);
      toast.success('已复制占位符回填模板', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析占位符回填模板失败:', error);
    }
  };

  const handleOpenPlaceholderFillTemplate = () => {
    if (!placeholderFillTemplateJsonText || isFilterPending || !onOpenTemplateFill) return;

    onOpenTemplateFill(placeholderFillTemplateJsonText);
    toast.success('已填入模板填充', { duration: 1600 });
  };

  const handleCopyIssueSamples = async () => {
    if (!issueSampleCopyText || isFilterPending) return;

    try {
      await copyText(issueSampleCopyText);
      toast.success('已复制问题样本', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析问题样本失败:', error);
    }
  };

  const handleCopyIssueSampleJson = async () => {
    if (!issueSampleJsonCopyText || isFilterPending) return;

    try {
      await copyText(issueSampleJsonCopyText);
      toast.success('已复制样本 JSON', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析样本 JSON 失败:', error);
    }
  };

  const handleCopyRedactedIssueSampleJson = async () => {
    if (!redactedIssueSampleJsonCopyText || isFilterPending) return;

    try {
      await copyText(redactedIssueSampleJsonCopyText);
      toast.success('已复制脱敏样本 JSON', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析脱敏样本 JSON 失败:', error);
    }
  };

  const handleCopyIssueRegressionTemplate = async () => {
    if (!issueRegressionTemplateCopyText || isFilterPending) return;

    try {
      await copyText(issueRegressionTemplateCopyText);
      toast.success('已复制回归模板', { duration: 2000 });
    } catch (error) {
      showCopyError('复制深度解析回归模板失败:', error);
    }
  };

  const handleCopyPath = async (path: string, successMessage = '已复制路径') => {
    try {
      await copyText(path);
      toast.success(successMessage, { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析路径失败:', error);
    }
  };

  const handleCopyOriginalValue = async (value: string, successMessage = '已复制原始值') => {
    try {
      await copyText(value);
      toast.success(successMessage, { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析原始值失败:', error);
    }
  };

  const handleCopyDecodedPathValue = async (value: string) => {
    try {
      await copyText(value);
      toast.success('已复制路径和值', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析内部路径和值失败:', error);
    }
  };

  const handleCopyCmdStructure = async (record: TransformReportRecord) => {
    try {
      const cmdStructureCopyText = getTransformRecordCmdStructureCopyText(record);
      if (!cmdStructureCopyText) return;

      await copyText(cmdStructureCopyText);
      toast.success(record.cmdStructureFocusPaths?.length ? '已复制聚焦 CMD 结构' : '已复制 CMD 结构', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 结构失败:', error);
    }
  };

  const handleCopyCmdComparisonPackage = async (record: TransformReportRecord) => {
    try {
      const comparisonPackageText = formatTransformCmdStructureComparisonPackageText(record);
      if (!comparisonPackageText) return;

      await copyText(comparisonPackageText);
      toast.success('已复制 CMD 对比包', { duration: 1600 });
    } catch (error) {
      showCopyError('复制深度解析 CMD 对比包失败:', error);
    }
  };

  const buildCmdComparisonReportText = (
    record: TransformReportRecord,
    actualCandidate?: CmdComparisonCandidateInput | null
  ): string => {
    const actualText = actualCandidate ? '' : getTransformRecordCmdStructureCopyText(record);
    if ((!actualCandidate && !actualText) || !cmdComparisonExpectedText.trim()) return '';

    const actual = actualCandidate?.actual || parseCmdStructureJson(actualText, '本工具 CMD 结构');
    const expected = parseCmdStructureJson(cmdComparisonExpectedText, 'cmdHandler 输出');
    assertRecognizableCmdComparisonExpected(expected);
    const diff = diffCmdStructures(actual, expected, {
      ignoreExtraPaths: cmdComparisonIgnoreExtraPaths,
    });
    return formatCmdStructureDiff(diff, {
      path: actualCandidate?.id || record.path,
      sourceLabel: actualCandidate?.sourceLabel || record.sourceLabel,
      tool: APP_VERSION_METADATA,
      modeLabel: cmdComparisonIgnoreExtraPaths ? '忽略 actual 额外路径' : undefined,
    });
  };

  const findActiveCmdComparisonRecord = (): TransformReportRecord | null => {
    if (!cmdComparisonRecordPath) return null;

    return reportView?.records.find(record => record.path === cmdComparisonRecordPath && record.hasCmdStructure) ||
      reportView?.cmdStructureRecords.find(record => record.path === cmdComparisonRecordPath) ||
      fullReportView?.records.find(record => record.path === cmdComparisonRecordPath && record.hasCmdStructure) ||
      fullReportView?.cmdStructureRecords.find(record => record.path === cmdComparisonRecordPath) ||
      report?.records.find(record => record.path === cmdComparisonRecordPath && record.hasCmdStructure) ||
      null;
  };

  const buildCmdComparisonCandidates = (
    expected: ReturnType<typeof parseCmdStructureJson>,
    activeRecord?: TransformReportRecord | null
  ): RankedCmdComparisonCandidate[] => {
    const candidateRecords = report?.records.filter(candidateRecord => candidateRecord.hasCmdStructure) ||
      fullReportView?.cmdStructureRecords ||
      reportView?.cmdStructureRecords ||
      [];
    const candidateRecordMap = new Map<string, TransformReportRecord>();
    candidateRecords.forEach(candidateRecord => {
      candidateRecordMap.set(candidateRecord.path, candidateRecord);
    });
    if (activeRecord) {
      candidateRecordMap.set(activeRecord.path, activeRecord);
    }

    const candidateInputs = Array.from(candidateRecordMap.values()).reduce<CmdComparisonCandidateInput[]>((items, candidateRecord) => {
      const candidateText = getTransformRecordCmdStructureCopyText(candidateRecord);
      if (!candidateText) return items;

      try {
        const actual = parseCmdStructureJson(candidateText, '本工具 CMD 结构');
        items.push({
          id: candidateRecord.path,
          label: candidateRecord.path,
          sourceLabel: candidateRecord.sourceLabel,
          commandSchema: candidateRecord.commandSchema,
          actual,
          recordPath: candidateRecord.path,
        });
        collectActualCmdStructureCandidates(actual).forEach(candidate => {
          const id = rebaseCmdStructureCandidatePath(candidateRecord.path, candidate.id);
          if (id === candidateRecord.path) return;

          items.push({
            id,
            label: id,
            sourceLabel: candidate.sourceLabel || candidateRecord.sourceLabel,
            commandSchema: candidate.commandSchema,
            actual: candidate.actual,
            recordPath: candidateRecord.path,
          });
        });
      } catch {
        // 单条候选解析失败不影响其他 CMD 的推荐排序。
      }

      return items;
    }, []);
    const candidateInputMap = new Map(candidateInputs.map(candidate => [candidate.id, candidate]));

    return rankCmdStructureCandidates(candidateInputs, expected, {
      ignoreExtraPaths: cmdComparisonIgnoreExtraPaths,
      limit: 3,
    }).map(candidate => {
      const input = candidateInputMap.get(candidate.id);
      return {
        ...candidate,
        actual: input?.actual ?? {},
        recordPath: input?.recordPath ?? candidate.id,
      };
    });
  };

  const formatCmdComparisonCandidateText = (
    candidates: RankedCmdComparisonCandidate[],
    activeCandidateId: string
  ): string => {
    if (candidates.length <= 1) return '';

    const bestCandidate = candidates[0];
    const lines = [
      'cmdHandler actual 候选推荐',
      bestCandidate.id === activeCandidateId
        ? '- 当前 actual 已是最匹配候选'
        : `- 可能拿错 actual，建议优先切到 ${bestCandidate.label}`,
    ];

    candidates.forEach((candidate, index) => {
      const schema = candidate.commandSchema ? ` · ${candidate.commandSchema}` : '';
      const current = candidate.id === activeCandidateId ? ' · 当前' : '';
      lines.push(`- #${index + 1} ${candidate.label}${schema}${current}: ${formatCmdCandidateSummary(candidate)}`);
    });

    return lines.join('\n');
  };

  const buildActiveCmdComparisonReportText = (): string => {
    if (!cmdComparisonExpectedText.trim()) return '';

    const record = findActiveCmdComparisonRecord();
    if (!record) return '';

    return buildCmdComparisonReportText(record, cmdComparisonActualCandidate);
  };

  const buildActiveCmdComparisonCandidateText = (): string => {
    if (!cmdComparisonRecordPath || !cmdComparisonExpectedText.trim()) return '';

    try {
      const expected = parseCmdStructureJson(cmdComparisonExpectedText, 'cmdHandler 输出');
      assertRecognizableCmdComparisonExpected(expected);
      const activeRecord = findActiveCmdComparisonRecord();
      const activeCandidateId = cmdComparisonActualCandidate?.id || cmdComparisonRecordPath;
      return formatCmdComparisonCandidateText(
        buildCmdComparisonCandidates(expected, activeRecord),
        activeCandidateId
      );
    } catch {
      return '';
    }
  };

  const handleToggleCmdComparison = (record: TransformReportRecord) => {
    setCmdComparisonRecordPath(currentPath => {
      if (currentPath === record.path) {
        setCmdComparisonActualCandidate(null);
        setCmdComparisonExpectedText('');
        return null;
      }

      setCmdComparisonActualCandidate(null);
      setCmdComparisonExpectedText('');
      return record.path;
    });
  };

  const handleOpenFirstCmdComparison = () => {
    const firstRecord = reportView?.cmdStructureRecords[0];
    if (!firstRecord) return;

    setQuery('CMD结构');
    setCmdComparisonExpectedText('');
    setCmdComparisonActualCandidate(null);
    setCmdComparisonRecordPath(firstRecord.path);
  };

  const handleSwitchCmdComparisonCandidate = (candidate: RankedCmdComparisonCandidate) => {
    setQuery(candidate.recordPath);
    setCmdComparisonRecordPath(candidate.recordPath);
    setCmdComparisonActualCandidate(
      candidate.id === candidate.recordPath
        ? null
        : {
            id: candidate.id,
            label: candidate.label,
            sourceLabel: candidate.sourceLabel,
            commandSchema: candidate.commandSchema,
            actual: candidate.actual,
            recordPath: candidate.recordPath,
          }
    );
  };

  const handleCopyCmdComparisonDiff = async (record: TransformReportRecord) => {
    try {
      const reportText = buildCmdComparisonReportText(record, cmdComparisonActualCandidate);
      if (!reportText) return;

      await copyText(reportText);
      toast.success('已复制 CMD 差异报告', { duration: 1600 });
    } catch (error) {
      showCopyError('复制 CMD 差异报告失败:', error);
    }
  };

  const handleCopyCollaborationReport = async () => {
    if (!report || !reportView || isFilterPending) return;

    try {
      const collaborationReportText = formatTransformCollaborationReportText(report, reportView, deferredQuery, {
        cmdComparisonReportText: buildActiveCmdComparisonReportText(),
        cmdComparisonCandidateText: buildActiveCmdComparisonCandidateText(),
      });
      await copyText(collaborationReportText);
      toast.success(formatCopySuccessMessage('排查报告', collaborationReportText), { duration: 2000 });
    } catch (error) {
      showCopyError('复制协作排查报告失败:', error);
    }
  };

  const handleLocatePath = (path: string) => {
    if (!onLocatePath) return;

    onLocatePath(path);
    toast.success('已填入 JSONPath 查询', { duration: 1600 });
  };

  const handleOpenSchemeValue = (value: string) => {
    if (!onOpenSchemeValue) return;

    onOpenSchemeValue(value);
    toast.success('已填入 Scheme 解析', { duration: 1600 });
  };

  const issueTriageItems = report ? [
    ...(report.summary.warningCount > 0 ? [{
      key: 'warning',
      label: '跳过记录',
      count: report.summary.warningCount,
      description: '先确认超长字段或预算跳过，必要时单独粘贴字段到 Scheme 面板解析。',
      actionLabel: '查看跳过',
      title: '筛选性能保护跳过记录',
      onClick: () => setQuery('跳过'),
    }] : []),
    ...(report.summary.unresolvedCount > 0 ? [{
      key: 'unresolved',
      label: '待检查',
      count: report.summary.unresolvedCount,
      description: '检查已解码但未结构化的字段，判断是否需要补解析规则或只是普通埋点。',
      actionLabel: '查看待检查',
      title: '筛选未展开线索',
      onClick: () => setQuery('待检查'),
    }] : []),
    ...(report.summary.placeholderCount > 0 ? [{
      key: 'placeholder',
      label: '占位符',
      count: report.summary.placeholderCount,
      description: '优先回填运行时占位符，再观察 CMD 结构数和覆盖质量是否变化。',
      actionLabel: onOpenTemplateFill && placeholderFillTemplateJsonText && !isFilterPending ? '回填占位符' : '查看占位符',
      title: getPlaceholderFillTemplateTitle('把运行时占位符回填模板填入模板填充面板'),
      onClick: () => {
        if (onOpenTemplateFill && placeholderFillTemplateJsonText && !isFilterPending) {
          handleOpenPlaceholderFillTemplate();
          return;
        }

        setQuery('占位符');
      },
    }] : []),
  ] : [];

  const buildNextActions = (): ReportNextAction[] => {
    const actions: ReportNextAction[] = [];

    if (report && reportView?.filteredCmdStructureCount) {
      actions.push({
        key: 'compare-cmd',
        label: '对比 cmdHandler',
        description: '打开当前筛选下的第一条 CMD 结构，粘贴内部解析结果后看差异。',
        title: '打开第一条 CMD 结构的 cmdHandler 对比',
        tone: 'primary',
        disabled: isFilterPending,
        onClick: handleOpenFirstCmdComparison,
      });
    }

    if (report?.summary.placeholderCount) {
      const canOpenTemplateFill = Boolean(onOpenTemplateFill && placeholderFillTemplateJsonText && !isFilterPending);
      actions.push({
        key: 'placeholder',
        label: canOpenTemplateFill ? '回填占位符' : '查看占位符',
        description: canOpenTemplateFill
          ? '带入候选值后重新生成质量对比，判断覆盖率和 CMD 结构变化。'
          : '先定位运行时占位符，再确认需要服务端或客户端补哪些值。',
        title: getPlaceholderFillTemplateTitle('把运行时占位符回填模板填入模板填充面板'),
        tone: 'purple',
        disabled: isFilterPending,
        onClick: () => {
          if (canOpenTemplateFill) {
            handleOpenPlaceholderFillTemplate();
            return;
          }

          setQuery('占位符');
        },
      });
    } else if (issuePriorityCount > 0) {
      actions.push({
        key: 'triage',
        label: '查看待处理',
        description: '聚焦待检查、跳过和占位符，先把影响解析质量的风险收敛。',
        title: '筛选待检查、跳过记录和运行时占位符',
        tone: 'rose',
        disabled: isFilterPending,
        onClick: () => setQuery('待处理'),
      });
    }

    if (reportView) {
      actions.push({
        key: 'archive',
        label: '复制归档包',
        description: '复制质量快照、脱敏问题样本和 corpus 沉淀清单，不携带原始 response。',
        title: archivePackageCopyTitle,
        tone: 'cyan',
        disabled: isFilterPending,
        onClick: () => {
          void handleCopyArchivePackage();
        },
      });
    }

    if (actions.length < 3 && reportView) {
      actions.push({
        key: 'collaboration',
        label: '复制协作报告',
        description: '把诊断摘要、质量要点和 cmdHandler 对齐状态发给协作者。',
        title: collaborationReportCopyTitle,
        tone: 'cyan',
        disabled: isFilterPending,
        onClick: () => {
          void handleCopyCollaborationReport();
        },
      });
    }

    if (actions.length < 3 && reportView) {
      actions.push({
        key: 'quality-snapshot',
        label: '复制质量快照',
        description: '保存不含原始值的结构化质量指标，便于后续趋势对比。',
        title: qualitySnapshotCopyTitle,
        tone: 'cyan',
        disabled: isFilterPending,
        onClick: () => {
          void handleCopyQualitySnapshot();
        },
      });
    }

    return actions.slice(0, 3);
  };

  const nextActions = buildNextActions();

  const renderCmdComparisonPanel = (record: TransformReportRecord) => {
    if (cmdComparisonRecordPath !== record.path) return null;

    const expectedText = cmdComparisonExpectedText.trim();
    let diffReportText = '';
    let diffSummary: {
      hasDifferences: boolean;
      missingLabel: string;
      extraLabel: string;
      ignoredExtraLabel: string;
      valueDiffCount: number;
      hasSchemaDiff: boolean;
      hasSourceDiff: boolean;
      previewLines: string[];
    } | null = null;
    let errorText = '';
    let candidateRecommendations: RankedCmdComparisonCandidate[] = [];
    const activeCandidate = cmdComparisonActualCandidate?.recordPath === record.path
      ? cmdComparisonActualCandidate
      : null;
    const activeCandidateId = activeCandidate?.id || record.path;

    if (expectedText) {
      try {
        const actual = activeCandidate?.actual || parseCmdStructureJson(
          getTransformRecordCmdStructureCopyText(record),
          '本工具 CMD 结构'
        );
        const expected = parseCmdStructureJson(expectedText, 'cmdHandler 输出');
        assertRecognizableCmdComparisonExpected(expected);
        const diff = diffCmdStructures(actual, expected, {
          ignoreExtraPaths: cmdComparisonIgnoreExtraPaths,
        });
        diffReportText = formatCmdStructureDiff(diff, {
          path: activeCandidate?.id || record.path,
          sourceLabel: activeCandidate?.sourceLabel || record.sourceLabel,
          tool: APP_VERSION_METADATA,
          modeLabel: cmdComparisonIgnoreExtraPaths ? '忽略 actual 额外路径' : undefined,
        });
        diffSummary = {
          hasDifferences: diff.hasDifferences,
          missingLabel: formatCmdPathCountSummary('缺失', diff.missingPaths),
          extraLabel: formatCmdPathCountSummary('额外', diff.extraPaths),
          ignoredExtraLabel: diff.ignoredExtraPaths.length
            ? formatCmdPathCountSummary('已忽略', diff.ignoredExtraPaths)
            : '',
          valueDiffCount: diff.valueDiffs.length,
          hasSchemaDiff: Boolean(diff.schemaDiff),
          hasSourceDiff: Boolean(diff.sourceDiff),
          previewLines: diffReportText.split('\n').slice(1, 6),
        };
        candidateRecommendations = buildCmdComparisonCandidates(expected, record);
      } catch (error) {
        errorText = error instanceof Error ? error.message : String(error);
      }
    }
    const bestCandidate = candidateRecommendations[0];
    const shouldWarnCurrentCandidate = Boolean(bestCandidate && bestCandidate.id !== activeCandidateId);

    return (
      <div data-tour="transform-report-cmd-comparison-panel" className="mt-2 rounded border border-teal-800/50 bg-teal-950/20 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-teal-100">cmdHandler 对比</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-tour="transform-report-copy-cmd-comparison-diff"
              onClick={() => handleCopyCmdComparisonDiff(record)}
              disabled={!diffReportText}
              className="text-gray-400 hover:text-teal-100 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="复制当前 actual 与 cmdHandler expected 的差异报告"
            >
              复制差异
            </button>
            <button
              type="button"
              onClick={() => handleToggleCmdComparison(record)}
              className="text-gray-400 hover:text-teal-100 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
            >
              收起
            </button>
          </div>
        </div>
        <textarea
          data-tour="transform-report-cmd-comparison-input"
          value={cmdComparisonExpectedText}
          onChange={(event) => setCmdComparisonExpectedText(event.target.value)}
          placeholder="粘贴 cmdHandler 输出或整段 response，支持 JSON / result / data / 代码块 / 日志前缀"
          title="粘贴 cmdHandler 输出或整段 response，支持 JSON、result/data 包裹、Markdown 代码块、日志前缀、树形文本和字符串化 JSON"
          className="mt-2 h-24 w-full resize-y rounded border border-editor-border bg-editor-bg px-2 py-1.5 font-mono text-xs text-gray-200 outline-none focus:border-teal-600"
          spellCheck={false}
        />
        <label
          className="mt-2 flex items-center gap-2 text-gray-400"
          title="expected 只保存稳定子集时，忽略本工具 actual 中多出的路径"
        >
          <input
            type="checkbox"
            checked={cmdComparisonIgnoreExtraPaths}
            onChange={(event) => setCmdComparisonIgnoreExtraPaths(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-editor-border bg-editor-bg text-teal-500 focus:ring-teal-600"
          />
          <span>忽略 actual 额外路径</span>
        </label>
        {!expectedText && (
          <div className="mt-1 text-gray-500">
            把内部 cmdHandler 的解析结果或接口 response 粘到这里，会自动清洗日志前缀、Markdown 代码块、树形文本或字符串化 JSON，并对比 cmdSchema、source 和 cmdParams 路径值差异。
          </div>
        )}
        {errorText && (
          <div className="mt-1 text-amber-200">
            {errorText}
          </div>
        )}
        {diffSummary && (
          <div className="mt-1 flex flex-col gap-1">
            <div className={diffSummary.hasDifferences ? 'text-amber-200' : 'text-emerald-200'}>
              {diffSummary.hasDifferences
                ? `存在差异：Schema ${diffSummary.hasSchemaDiff ? 1 : 0}，Source ${diffSummary.hasSourceDiff ? 1 : 0}，${diffSummary.missingLabel}，${diffSummary.extraLabel}，值不一致 ${diffSummary.valueDiffCount}${diffSummary.ignoredExtraLabel ? `，${diffSummary.ignoredExtraLabel}` : ''}`
                : `结构一致${diffSummary.ignoredExtraLabel ? `，${diffSummary.ignoredExtraLabel.replace('已忽略', '已忽略额外')}` : ''}`}
            </div>
            {diffSummary.previewLines.length > 0 && (
              <div className="flex flex-col gap-0.5 font-mono text-gray-400">
                {diffSummary.previewLines.map(line => (
                  <div key={`${record.path}:cmd-diff:${line}`} className="truncate" title={line}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {candidateRecommendations.length > 1 && (
          <div data-tour="transform-report-cmd-candidate-recommendations" className="mt-2 rounded border border-editor-border bg-editor-bg/70 px-2 py-1.5">
            <div className={shouldWarnCurrentCandidate ? 'text-amber-200' : 'text-gray-300'}>
              {shouldWarnCurrentCandidate
                ? '可能拿错 actual，下面的 CMD 与 expected 更接近'
                : '当前 actual 已是最匹配候选'}
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {candidateRecommendations.map((candidate, index) => {
                const isCurrentCandidate = candidate.id === activeCandidateId;
                const summary = formatCmdCandidateSummary(candidate);
                return (
                  <button
                    key={`${record.path}:cmd-candidate:${candidate.id}`}
                    type="button"
                    data-tour="transform-report-cmd-candidate"
                    onClick={() => handleSwitchCmdComparisonCandidate(candidate)}
                    disabled={isCurrentCandidate}
                    className="flex min-w-0 items-center justify-between gap-2 rounded border border-editor-border bg-editor-sidebar px-2 py-1 text-left text-gray-300 transition-colors hover:border-teal-700 hover:text-teal-100 disabled:cursor-default disabled:opacity-70"
                    title={`${candidate.label} · ${summary}`}
                  >
                    <span className="min-w-0 flex items-center gap-1.5">
                      <span className={candidate.isExactMatch ? 'text-emerald-300' : index === 0 ? 'text-amber-200' : 'text-gray-500'}>
                        #{index + 1}
                      </span>
                      <span className="max-w-[220px] truncate font-mono text-emerald-300">
                        {candidate.label}
                      </span>
                      {candidate.sourceLabel && (
                        <SourceLabelBadge label={candidate.sourceLabel} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right text-gray-400">
                      {isCurrentCandidate ? '当前 · ' : ''}
                      {candidate.commandSchema ? `${candidate.commandSchema} · ` : ''}
                      {summary}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="min-w-[220px] flex-1 text-xs text-gray-500">
        {report
          ? `${reportView?.filteredRecordCount || 0}/${reportView?.totalRecordCount || 0} 条展开记录 · ${reportView?.filteredCmdStructureCount || 0}/${reportView?.totalCmdStructureCount || 0} 条CMD结构 · ${reportView?.filteredNestedCommandFieldCount || 0}/${reportView?.totalNestedCommandFieldCount || 0} 个内部CMD字段 · ${reportView?.filteredNestedResourceFieldCount || 0}/${reportView?.totalNestedResourceFieldCount || 0} 个资源字段 · ${reportView?.filteredPlaceholderCount || 0}/${reportView?.totalPlaceholderCount || 0} 个占位符 · ${reportView?.filteredUnresolvedCount || 0}/${reportView?.totalUnresolvedCount || 0} 条待检查 · ${reportView?.filteredWarningCount || 0}/${reportView?.totalWarningCount || 0} 条跳过记录`
          : '暂无解析上下文'}
      </div>
      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
        {query.trim() && (
          <button
            onClick={handleCopyFilteredReport}
            disabled={!reportView || isFilterPending}
            className="whitespace-nowrap px-2.5 py-1 text-sm bg-cyan-900/40 text-cyan-100 rounded hover:bg-cyan-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={filteredReportCopyTitle}
            aria-label={`复制筛选结果，${filteredReportCopyTitle}`}
          >
            复制筛选结果
          </button>
        )}
        <button
          data-tour="transform-report-copy-collaboration-report"
          onClick={handleCopyCollaborationReport}
          disabled={!reportView || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-cyan-900/40 text-cyan-100 rounded hover:bg-cyan-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={collaborationReportCopyTitle}
          aria-label={`复制排查报告，${collaborationReportCopyTitle}`}
        >
          复制排查报告
        </button>
        <button
          data-tour="transform-report-copy-diagnostic-summary"
          onClick={handleCopyDiagnosticSummary}
          disabled={!reportView || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={diagnosticSummaryCopyTitle}
          aria-label={`复制诊断摘要，${diagnosticSummaryCopyTitle}`}
        >
          复制诊断摘要
        </button>
        <button
          data-tour="transform-report-copy-quality-snapshot"
          onClick={handleCopyQualitySnapshot}
          disabled={!reportView || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={qualitySnapshotCopyTitle}
          aria-label={`复制质量快照，${qualitySnapshotCopyTitle}`}
        >
          复制质量快照
        </button>
        <button
          data-tour="transform-report-set-quality-baseline"
          onClick={handleSetQualityBaseline}
          disabled={!qualitySnapshot || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isFilterPending ? '筛选结果仍在更新，请稍后设为基线' : '将当前不含原始 response 的质量快照设为临时基线'}
          aria-label="设为质量基线，将当前不含原始 response 的质量快照设为临时基线"
        >
          设为基线
        </button>
        {qualityBaseline && (
          <>
            <button
              data-tour="transform-report-copy-quality-baseline-delta"
              onClick={handleCopyQualityBaselineDelta}
              disabled={!qualityBaselineDeltaText || isFilterPending}
              className="whitespace-nowrap px-2.5 py-1 text-sm bg-emerald-900/40 text-emerald-100 rounded hover:bg-emerald-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`${qualityBaselineCopyTitle}；基线筛选: ${qualityBaseline.filter}`}
              aria-label={`复制质量对比，${qualityBaselineCopyTitle}`}
            >
              复制质量对比
            </button>
            <button
              data-tour="transform-report-clear-quality-baseline"
              onClick={handleClearQualityBaseline}
              className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-300 rounded hover:bg-editor-border transition-colors"
              title={`清除临时质量基线；基线筛选: ${qualityBaseline.filter}`}
              aria-label="清除临时质量基线"
            >
              清除基线
            </button>
          </>
        )}
        <button
          data-tour="transform-report-copy-archive-package"
          onClick={handleCopyArchivePackage}
          disabled={!reportView || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-cyan-900/40 text-cyan-100 rounded hover:bg-cyan-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={archivePackageCopyTitle}
          aria-label={`复制归档包，${archivePackageCopyTitle}`}
        >
          复制归档包
        </button>
        <button
          data-tour="transform-report-copy-troubleshooting-recipe"
          onClick={handleCopyTroubleshootingRecipe}
          disabled={!reportView || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-300 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={troubleshootingRecipeCopyTitle}
          aria-label={`复制排查 recipe，${troubleshootingRecipeCopyTitle}`}
        >
          复制 recipe
        </button>
        <button
          data-tour="transform-report-copy-path-values"
          onClick={handleCopyPathValueReport}
          disabled={!hasPathValueCopyItems || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={pathValuesCopyTitle}
          aria-label={`复制路径值，${pathValuesCopyTitle}`}
        >
          复制路径值
        </button>
        {hasCmdStructureCopyItems && (
          <button
            data-tour="transform-report-copy-cmd-structures"
            onClick={handleCopyCmdStructureReport}
            disabled={isFilterPending}
            className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={cmdStructuresCopyTitle}
            aria-label={`${hasFocusedCmdStructureCopyItems ? '复制聚焦 CMD' : '复制 CMD 结构'}，${cmdStructuresCopyTitle}`}
          >
            {hasFocusedCmdStructureCopyItems ? '复制聚焦 CMD' : '复制 CMD 结构'}
          </button>
        )}
        <button
          data-tour="transform-report-copy-issue-samples"
          onClick={handleCopyIssueSamples}
          disabled={!issueSampleCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={issueSamplesCopyTitle}
          aria-label={`复制问题样本，${issueSamplesCopyTitle}`}
        >
          复制问题样本
        </button>
        <button
          data-tour="transform-report-copy-issue-sample-json"
          onClick={handleCopyIssueSampleJson}
          disabled={!issueSampleJsonCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={issueSampleJsonCopyTitle}
          aria-label={`复制样本 JSON，${issueSampleJsonCopyTitle}`}
        >
          复制样本 JSON
        </button>
        <button
          data-tour="transform-report-copy-redacted-issue-sample-json"
          onClick={handleCopyRedactedIssueSampleJson}
          disabled={!redactedIssueSampleJsonCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={redactedIssueSampleJsonCopyTitle}
          aria-label={`复制脱敏 JSON，${redactedIssueSampleJsonCopyTitle}`}
        >
          复制脱敏 JSON
        </button>
        <button
          data-tour="transform-report-copy-issue-regression-template"
          onClick={handleCopyIssueRegressionTemplate}
          disabled={!issueRegressionTemplateCopyText || isFilterPending}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={issueRegressionTemplateCopyTitle}
          aria-label={`复制回归模板，${issueRegressionTemplateCopyTitle}`}
        >
          复制回归模板
        </button>
        <button
          data-tour="transform-report-copy-full-report"
          onClick={handleCopyReport}
          disabled={!activeContext}
          className="whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={fullReportCopyTitle}
          aria-label={`复制报告，${fullReportCopyTitle}`}
        >
          复制报告
        </button>
      </div>
    </div>
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="深度解析报告"
      icon={PanelIcons.Code}
      storageKey="transform-report-panel"
      defaultPosition={{ x: 220, y: 120 }}
      defaultSize={{ width: 680, height: 520 }}
      minSize={{ width: 480, height: 320 }}
      footer={footer}
      dataTour="transform-report-panel"
    >
      <div className="flex-1 min-h-0 overflow-y-auto bg-editor-bg p-3">
        {!report ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            暂无深度解析上下文
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded border border-editor-border bg-editor-sidebar px-3 py-2">
              <div className="text-xs text-cyan-200">{report.summaryText || '深度解析: 无展开记录'}</div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                  展开 {report.summary.recordCount}
                </span>
                <SummaryMetricChip
                  label="CMD"
                  count={report.summary.schemeCounts.queryString}
                  query="CMD 参数"
                  dataTour="transform-report-cmd-count"
                  title="筛选 CMD 参数展开记录"
                  onFilter={setQuery}
                />
                <SummaryMetricChip
                  label="URL"
                  count={report.summary.schemeCounts.url}
                  query="URL Scheme"
                  dataTour="transform-report-url-count"
                  title="筛选 URL Scheme 展开记录"
                  onFilter={setQuery}
                />
                <SummaryMetricChip
                  label="Base64"
                  count={report.summary.schemeCounts.base64}
                  query="Base64"
                  dataTour="transform-report-base64-count"
                  title="筛选 Base64 展开记录"
                  onFilter={setQuery}
                />
                {report.cmdStructureCount > 0 && (
                  <>
                    <button
                      type="button"
                      data-tour="transform-report-cmd-structure-count"
                      onClick={() => setQuery('CMD结构')}
                      className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded hover:bg-cyan-900/50 transition-colors"
                      title="筛选可复制的 cmdHandler CMD 结构"
                    >
                      CMD结构 {report.cmdStructureCount}
                    </button>
                    <button
                      type="button"
                      data-tour="transform-report-open-first-cmd-comparison"
                      onClick={handleOpenFirstCmdComparison}
                      disabled={!reportView || reportView.filteredCmdStructureCount === 0 || isFilterPending}
                      className="bg-teal-950/40 text-teal-100 border border-teal-800/60 px-2 py-0.5 rounded hover:bg-teal-900/55 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      title="打开第一条 CMD 结构的 cmdHandler 对比"
                    >
                      对比cmdHandler
                    </button>
                  </>
                )}
                {report.nestedCommandFieldCount > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-nested-cmd-count"
                    onClick={() => setQuery('内部CMD字段')}
                    className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded hover:bg-cyan-900/50 transition-colors"
                    title="筛选包含内部 CMD/Scheme 字段的展开记录"
                  >
                    内部CMD {report.nestedCommandFieldCount}
                  </button>
                )}
                {(report.nestedResourceFieldCount || 0) > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-nested-resource-count"
                    onClick={() => setQuery('资源URL')}
                    className="bg-slate-900/45 text-slate-100 border border-slate-700/60 px-2 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
                    title="筛选包含静态素材资源 URL 的展开记录"
                  >
                    资源URL {report.nestedResourceFieldCount}
                  </button>
                )}
                {issuePriorityCount > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-issue-priority"
                    onClick={() => setQuery('待处理')}
                    className="bg-rose-950/35 text-rose-100 border border-rose-700/60 px-2 py-0.5 rounded hover:bg-rose-900/55 transition-colors"
                    title="筛选待检查、跳过记录和运行时占位符"
                  >
                    待处理 {issuePriorityCount}
                  </button>
                )}
                {report.summary.schemeCounts.nonReversible > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-non-reversible-count"
                    onClick={() => setQuery('不可逆')}
                    className="bg-amber-900/30 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded hover:bg-amber-800/50 transition-colors"
                    title="筛选不可逆解析记录"
                  >
                    不可逆 {report.summary.schemeCounts.nonReversible}
                  </button>
                )}
                {report.summary.unresolvedCount > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-unresolved-count"
                    onClick={() => setQuery('待检查')}
                    className="bg-sky-900/30 text-sky-200 border border-sky-700/50 px-2 py-0.5 rounded hover:bg-sky-800/50 transition-colors"
                    title="筛选未展开线索"
                  >
                    待检查 {report.summary.unresolvedCount}
                  </button>
                )}
                {report.summary.warningCount > 0 && (
                  <button
                    type="button"
                    data-tour="transform-report-warning-count"
                    onClick={() => setQuery('跳过')}
                    className="bg-amber-900/30 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded hover:bg-amber-800/50 transition-colors"
                    title="筛选性能保护跳过记录"
                  >
                    跳过 {report.summary.warningCount}
                  </button>
                )}
                {report.summary.placeholderCount > 0 && (
                  <>
                    <button
                      type="button"
                      data-tour="transform-report-placeholder-count"
                      onClick={() => setQuery('占位符')}
                      className="bg-violet-900/30 text-violet-200 border border-violet-700/50 px-2 py-0.5 rounded hover:bg-violet-800/50 transition-colors"
                      title="筛选运行时占位符"
                    >
                      占位符 {report.summary.placeholderCount}
                    </button>
                    {onOpenTemplateFill && (
                      <button
                        type="button"
                        data-tour="transform-report-open-placeholder-fill-shortcut"
                        onClick={handleOpenPlaceholderFillTemplate}
                        disabled={!placeholderFillTemplateJsonText || isFilterPending}
                        className="bg-violet-950/40 text-violet-100 border border-violet-700/60 px-2 py-0.5 rounded hover:bg-violet-900/55 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        title={getPlaceholderFillTemplateTitle('把运行时占位符回填模板填入模板填充面板')}
                      >
                        回填占位符{placeholderFillTemplateSummary ? ` ${placeholderFillTemplateSummary.filled}/${placeholderFillTemplateSummary.total}` : ''}
                      </button>
                    )}
                  </>
                )}
              </div>
              <div
                data-tour="transform-report-coverage"
                className={`mt-2 rounded border px-2 py-1.5 text-xs ${getCoverageClassName(report.coverage.level)}`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{report.coverage.label}</span>
                  <span className="text-current/80">{report.coverage.description}</span>
                </div>
                {report.coverage.items.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {report.coverage.items.map(item => (
                      <span
                        key={item}
                        className="rounded bg-editor-bg/70 px-2 py-0.5 text-current/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {nextActions.length > 0 && (
                <div
                  data-tour="transform-report-next-actions"
                  className="mt-2 rounded border border-cyan-800/40 bg-cyan-950/15 px-2.5 py-2 text-xs"
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-cyan-100">真实 response 下一步</div>
                    <div className="text-gray-500">推荐 {nextActions.length} 项</div>
                  </div>
                  <div className="grid gap-1.5 md:grid-cols-3">
                    {nextActions.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        data-tour={`transform-report-next-action-${item.key}`}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={getNextActionClassName(item.tone)}
                        title={item.title}
                        aria-label={`${item.label}，${item.title}`}
                      >
                        <span className="block font-medium">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-current/75">
                          {item.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {issueTriageItems.length > 0 && (
                <div
                  data-tour="transform-report-issue-triage"
                  className="mt-2 rounded border border-rose-800/40 bg-rose-950/15 px-2.5 py-2 text-xs"
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-rose-100">建议优先处理</div>
                    <button
                      type="button"
                      data-tour="transform-report-triage-all"
                      onClick={() => setQuery('待处理')}
                      className="rounded border border-rose-800/60 bg-editor-bg px-2 py-0.5 text-rose-100 transition-colors hover:bg-rose-900/40"
                      title="筛选全部待处理项"
                    >
                      全部待处理 {issuePriorityCount}
                    </button>
                  </div>
                  <div className="grid gap-1.5 md:grid-cols-3">
                    {issueTriageItems.map(item => (
                      <div
                        key={item.key}
                        className="rounded border border-editor-border bg-editor-bg/80 px-2 py-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-gray-200">
                            {item.label} {item.count}
                          </div>
                          <button
                            type="button"
                            data-tour={`transform-report-triage-action-${item.key}`}
                            onClick={item.onClick}
                            className="shrink-0 rounded border border-editor-border bg-editor-sidebar px-2 py-0.5 text-gray-300 transition-colors hover:text-rose-100"
                            title={item.title}
                          >
                            {item.actionLabel}
                          </button>
                        </div>
                        <div className="mt-1 text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Boolean(report.topCommandSchemaOrigins?.length) && (
                <div data-tour="transform-report-top-command-schema-origins" className="mt-2 text-xs">
                  <div className="mb-1 text-gray-500">CMD 来源分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topCommandSchemaOrigins?.map(group => (
                      <button
                        key={group.origin}
                        type="button"
                        onClick={() => setQuery(group.origin)}
                        className="max-w-full rounded border border-teal-800/50 bg-teal-950/25 px-2 py-0.5 text-teal-100 transition-colors hover:bg-teal-900/45"
                        title={`${group.origin} 出现 ${group.count} 次，覆盖 ${group.schemaCount} 个 Schema、${group.recordCount} 条展开记录。示例 Schema：${group.schemas.join('；')}`}
                      >
                        <span className="inline-block max-w-[180px] truncate align-bottom font-mono">
                          {group.origin}
                        </span>
                        <span className="ml-1 text-teal-300/80">×{group.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Boolean(report.topCommandSchemas?.length) && (
                <div data-tour="transform-report-top-command-schemas" className="mt-2 text-xs">
                  <div className="mb-1 text-gray-500">CMD 跳转 Schema 分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topCommandSchemas?.map(group => (
                      <button
                        key={group.schema}
                        type="button"
                        onClick={() => setQuery(group.schema)}
                        className="max-w-full rounded border border-emerald-800/50 bg-emerald-950/25 px-2 py-0.5 text-emerald-100 transition-colors hover:bg-emerald-900/45"
                        title={`${group.schema} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
                      >
                        <span className="inline-block max-w-[220px] truncate align-bottom font-mono">
                          {group.schema}
                        </span>
                        <span className="ml-1 text-emerald-300/80">×{group.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Boolean(report.topResourceSchemas?.length) && (
                <div data-tour="transform-report-top-resource-schemas" className="mt-2 text-xs">
                  {Boolean(report.topResourceTypes?.length) && (
                    <div className="mb-2">
                      <div className="mb-1 text-gray-500">静态资源类型分布</div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.topResourceTypes?.map(group => (
                          <button
                            key={group.resourceType}
                            type="button"
                            onClick={() => setQuery(group.query)}
                            className="max-w-full rounded border border-sky-800/50 bg-sky-950/25 px-2 py-0.5 text-sky-100 transition-colors hover:bg-sky-900/45"
                            title={`${group.resourceTypeLabel} 占 ${group.percentage}%，出现 ${group.count} 次，覆盖 ${group.schemaCount} 个 URL、${group.recordCount} 条展开记录。示例 URL：${group.schemas.join('；')}`}
                          >
                            <span>{group.resourceTypeLabel}</span>
                            <span className="ml-1 text-sky-300/80">{group.percentage}%</span>
                            <span className="ml-1 text-sky-300/70">×{group.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-1 text-gray-500">静态资源 URL 分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topResourceSchemas?.map(group => (
                      <button
                        key={group.schema}
                        type="button"
                        onClick={() => setQuery(group.schema)}
                        className="max-w-full rounded border border-slate-700/60 bg-slate-900/40 px-2 py-0.5 text-slate-100 transition-colors hover:bg-slate-800/60"
                        title={`${group.resourceTypeLabel ? `${group.resourceTypeLabel} · ` : ''}${group.schema} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
                      >
                        {group.resourceTypeLabel && (
                          <span className="mr-1 rounded bg-slate-800 px-1 py-px text-[10px] text-slate-300">
                            {group.resourceTypeLabel}
                          </span>
                        )}
                        <span className="inline-block max-w-[220px] truncate align-bottom font-mono">
                          {group.schema}
                        </span>
                        <span className="ml-1 text-slate-300/80">×{group.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Boolean(report.topNestedCommandFields?.length) && (
                <div data-tour="transform-report-top-nested-cmd-fields" className="mt-2 text-xs">
                  <div className="mb-1 text-gray-500">内部CMD字段分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topNestedCommandFields?.map(group => (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => setQuery(group.key)}
                        className="max-w-full rounded border border-cyan-800/50 bg-cyan-950/30 px-2 py-0.5 text-cyan-100 transition-colors hover:bg-cyan-900/50"
                        title={`${group.key} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
                      >
                        <span className="font-mono">{group.key}</span>
                        <span className="ml-1 text-cyan-300/80">×{group.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {Boolean(report.topNestedResourceFields?.length) && (
                <div data-tour="transform-report-top-nested-resource-fields" className="mt-2 text-xs">
                  <div className="mb-1 text-gray-500">静态资源字段分布</div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.topNestedResourceFields?.map(group => (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => setQuery(group.key)}
                        className="max-w-full rounded border border-slate-700/60 bg-slate-900/40 px-2 py-0.5 text-slate-100 transition-colors hover:bg-slate-800/60"
                        title={`${group.key} 出现 ${group.count} 次，覆盖 ${group.recordCount} 条展开记录。示例路径：${group.paths.join('；')}`}
                      >
                        <span className="font-mono">{group.key}</span>
                        <span className="ml-1 text-slate-300/80">×{group.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                data-tour="transform-report-filter"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="筛选路径、类型、原始值、解析结果或占位符..."
                className="flex-1 min-w-0 bg-editor-sidebar text-gray-200 text-xs px-3 py-1.5 rounded border border-editor-border focus:border-cyan-600 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="shrink-0 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  清空
                </button>
              )}
              {isFilterPending && (
                <span className="shrink-0 text-xs text-cyan-400">
                  更新中...
                </span>
              )}
            </div>

            {reportView && reportView.filteredRecordCount > 0 && (
              <div data-tour="transform-report-records" className="flex flex-col gap-1.5">
                <div className="text-xs text-gray-500 font-medium">
                  展开记录 · {reportView.filteredRecordCount}
                  {reportView.isRecordTruncated && (
                    <span className="text-amber-300 ml-2">仅显示前 {reportView.records.length} 条</span>
                  )}
                </div>
                {reportView.records.map(record => (
                  <div
                    key={record.path}
                    data-tour="transform-report-row"
                    className="rounded border border-editor-border bg-editor-sidebar px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={record.sourceLabel} />
                        <span className="font-mono text-emerald-300 truncate" title={record.path}>
                          {record.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        {record.hasNonReversibleScheme && (
                          <span className="text-amber-200 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
                            不可逆
                          </span>
                        )}
                        <button
                          type="button"
                          data-tour="transform-report-copy-path"
                          onClick={() => handleCopyPath(record.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        <button
                          type="button"
                          data-tour="transform-report-copy-original-value"
                          onClick={() => handleCopyOriginalValue(record.originalValue)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制原始值
                        </button>
                        {record.hasCmdStructure && (
                          <>
                            <button
                              type="button"
                              data-tour="transform-report-copy-cmd-structure"
                              onClick={() => handleCopyCmdStructure(record)}
                              className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                              title={record.cmdStructureFocusPaths?.length
                                ? `复制按当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}裁剪后的 cmdParams`
                                : '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构'}
                            >
                              {record.cmdStructureFocusPaths?.length ? '复制聚焦 CMD' : '复制 CMD 结构'}
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-cmd-comparison-package"
                              onClick={() => handleCopyCmdComparisonPackage(record)}
                              className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                              title="复制可直接用于 cmd:diff -- --stdin 的 actual/expected 对比包"
                            >
                              复制对比包
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-open-cmd-comparison"
                              onClick={() => handleToggleCmdComparison(record)}
                              className="text-gray-400 hover:text-teal-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                              title="粘贴内部 cmdHandler 输出并在页面内查看差异"
                            >
                              对比 cmdHandler
                            </button>
                          </>
                        )}
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-path"
                            onClick={() => handleLocatePath(record.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        {onOpenSchemeValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-scheme"
                            onClick={() => handleOpenSchemeValue(record.originalValue)}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {record.labels.map((label, index) => (
                        <span
                          key={`${record.path}:${index}:${label}`}
                          className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded"
                        >
                          {label}
                        </span>
                      ))}
                      {record.nestedCommandFieldCount > 0 && (
                        <span
                          className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded"
                          title="该展开结果内部包含的 CMD/Scheme 字段数量"
                        >
                          内部CMD字段 {record.nestedCommandFieldCount}
                        </span>
                      )}
                      {(record.nestedResourceFieldCount || 0) > 0 && (
                        <span
                          className="bg-slate-900/45 text-slate-100 border border-slate-700/60 px-2 py-0.5 rounded"
                          title="该展开结果内部包含的静态素材资源字段数量"
                        >
                          资源URL {record.nestedResourceFieldCount}
                        </span>
                      )}
                      {record.cmdStructureFocusPaths?.length && (
                        <span
                          className="bg-emerald-950/40 text-emerald-200 border border-emerald-800/60 px-2 py-0.5 rounded"
                          title={`复制 CMD 结构时会只保留当前筛选命中的${record.cmdStructureFocusLabel || '内部路径'}`}
                        >
                          聚焦复制
                        </span>
                      )}
                    </div>
                    {record.insights.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {record.insights.map((insight, index) => (
                          <span
                            key={`${record.path}:insight:${index}:${insight}`}
                            className="bg-cyan-950/40 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded font-mono"
                            title={insight}
                          >
                            {insight}
                          </span>
                        ))}
                      </div>
                    )}
                    {record.hasCmdStructure && record.commandParamCount !== undefined && (
                      <div data-tour="transform-report-cmd-handler-summary" className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                        <span className="rounded bg-emerald-950/40 px-2 py-0.5 text-emerald-200 border border-emerald-800/50">
                          cmdHandler
                        </span>
                        {record.commandSchema && (
                          <button
                            type="button"
                            data-tour="transform-report-filter-command-schema"
                            onClick={() => setQuery(record.commandSchema || '')}
                            className="max-w-full rounded bg-editor-bg px-2 py-0.5 font-mono text-teal-200 transition-colors hover:bg-editor-active"
                            title={record.commandSchema}
                          >
                            <span className="text-gray-500">cmdSchema: </span>
                            <span className="inline-block max-w-[220px] truncate align-bottom">
                              {record.commandSchema}
                            </span>
                          </button>
                        )}
                        <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-300">
                          cmdParams · {record.commandParamCount}
                        </span>
                        {record.commandParamKeys?.map(key => (
                          <button
                            key={`${record.path}:cmd-param:${key}`}
                            type="button"
                            data-tour="transform-report-filter-command-param"
                            onClick={() => setQuery(key)}
                            className="rounded bg-emerald-950/25 px-2 py-0.5 font-mono text-emerald-100 transition-colors hover:bg-emerald-900/45"
                            title={`筛选 cmdParams.${key}`}
                          >
                            {key}
                          </button>
                        ))}
                        {(record.commandParamKeys?.length || 0) < record.commandParamCount && (
                          <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-500">
                            +{record.commandParamCount - (record.commandParamKeys?.length || 0)}
                          </span>
                        )}
                      </div>
                    )}
                    {renderCmdComparisonPanel(record)}
                    {record.commandSchemaRows?.length && (
                      <div data-tour="transform-report-command-schema-rows" className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">
                          CMD Schema路径 · 显示 {Math.min(record.commandSchemaRows.length, COMMAND_SCHEMA_ROW_DISPLAY_LIMIT)}/{record.commandSchemaRows.length} 条
                        </div>
                        {record.commandSchemaRows.slice(0, COMMAND_SCHEMA_ROW_DISPLAY_LIMIT).map(row => (
                          <div
                            key={`${record.path}:cmd-schema:${row.path}:${row.schema}`}
                            data-tour="transform-report-command-schema-row"
                            className="flex items-center justify-between gap-2 rounded bg-emerald-950/20 px-2 py-1"
                          >
                            <div className="min-w-0 flex items-center gap-1 font-mono overflow-hidden">
                              <span className="min-w-0 flex-1 text-emerald-200 truncate" title={row.path}>
                                {row.path}
                              </span>
                              <span className="shrink-0 text-gray-500">=</span>
                              <span className="min-w-0 flex-1 text-teal-200 truncate" title={row.schema}>
                                {row.schema}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-tour="transform-report-copy-command-schema-path"
                              onClick={() => handleCopyPath(row.path)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制路径
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-command-schema-row"
                              onClick={() => handleCopyDecodedPathValue(`${row.path} = ${JSON.stringify(row.schema)}`)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制片段
                            </button>
                            {onLocatePath && (
                              <button
                                type="button"
                                data-tour="transform-report-locate-command-schema-path"
                                onClick={() => handleLocatePath(row.path)}
                                className="shrink-0 text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                定位
                              </button>
                            )}
                          </div>
                        ))}
                        {record.commandSchemaRows.length > COMMAND_SCHEMA_ROW_DISPLAY_LIMIT && (
                          <div className="text-gray-500">
                            还有更多 CMD Schema 路径未展示，可搜索 schema 或来源展示隐藏项
                          </div>
                        )}
                      </div>
                    )}
                    {record.nestedCommandFields.length > 0 && (
                      <div data-tour="transform-report-nested-cmd-fields" className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">
                          内部CMD字段 · 显示 {record.nestedCommandFields.length}/{record.nestedCommandFieldCount} 个
                        </div>
                        {record.nestedCommandFields.map(row => {
                          const schemeInput = getDecodedPathSchemeInput(row);

                          return (
                            <div
                              key={`${record.path}:cmd-field:${row.path}`}
                              data-tour="transform-report-nested-cmd-field"
                              className="flex items-center justify-between gap-2 rounded bg-cyan-950/20 px-2 py-1"
                            >
                              <div className="min-w-0 flex items-center gap-1 font-mono overflow-hidden">
                                <span className="min-w-0 flex-1 text-emerald-200 truncate" title={row.path}>
                                  {row.path}
                                </span>
                                <span className="shrink-0 text-gray-500">=</span>
                                <span className="min-w-0 flex-1 text-cyan-200 truncate" title={row.preview}>
                                  {row.preview}
                                </span>
                              </div>
                              <button
                                type="button"
                                data-tour="transform-report-copy-nested-cmd-path"
                                onClick={() => handleCopyPath(row.path)}
                                className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                复制路径
                              </button>
                              <button
                                type="button"
                                data-tour="transform-report-copy-nested-cmd-value"
                                onClick={() => handleCopyDecodedPathValue(getTransformDecodedPathCopyText(row))}
                                className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                复制片段
                              </button>
                              {onOpenSchemeValue && schemeInput && (
                                <button
                                  type="button"
                                  data-tour="transform-report-open-nested-cmd-scheme"
                                  onClick={() => handleOpenSchemeValue(schemeInput)}
                                  className="shrink-0 text-gray-400 hover:text-violet-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                                >
                                  Scheme 打开
                                </button>
                              )}
                              {onLocatePath && (
                                <button
                                  type="button"
                                  data-tour="transform-report-locate-nested-cmd-path"
                                  onClick={() => handleLocatePath(row.path)}
                                  className="shrink-0 text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                                >
                                  定位
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {record.hasMoreNestedCommandFields && (
                          <div className="text-gray-500">
                            还有更多内部 CMD 字段未展示
                            {record.indexedNestedCommandFieldCount > record.nestedCommandFields.length && (
                              <span>
                                ，已索引 {record.indexedNestedCommandFieldCount} 个，可搜索字段名或 schema 展示隐藏项
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {Boolean(record.nestedResourceFields?.length) && (
                      <div data-tour="transform-report-nested-resource-fields" className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">
                          静态资源字段 · 显示 {record.nestedResourceFields?.length || 0}/{record.nestedResourceFieldCount || 0} 个
                        </div>
                        {record.nestedResourceFields?.map(row => (
                          <div
                            key={`${record.path}:resource-field:${row.path}`}
                            data-tour="transform-report-nested-resource-field"
                            className="flex items-center justify-between gap-2 rounded bg-slate-900/30 px-2 py-1"
                          >
                            <div className="min-w-0 flex items-center gap-1 font-mono overflow-hidden">
                              <span className="min-w-0 flex-1 text-slate-100 truncate" title={row.path}>
                                {row.path}
                              </span>
                              <span className="shrink-0 text-gray-500">=</span>
                              <span className="min-w-0 flex-1 text-slate-300 truncate" title={row.preview}>
                                {row.preview}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-tour="transform-report-copy-nested-resource-path"
                              onClick={() => handleCopyPath(row.path)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制路径
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-nested-resource-value"
                              onClick={() => handleCopyDecodedPathValue(getTransformDecodedPathCopyText(row))}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制片段
                            </button>
                            {onLocatePath && (
                              <button
                                type="button"
                                data-tour="transform-report-locate-nested-resource-path"
                                onClick={() => handleLocatePath(row.path)}
                                className="shrink-0 text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                定位
                              </button>
                            )}
                          </div>
                        ))}
                        {record.hasMoreNestedResourceFields && (
                          <div className="text-gray-500">
                            还有更多静态资源字段未展示
                            {(record.indexedNestedResourceFieldCount || 0) > (record.nestedResourceFields?.length || 0) && (
                              <span>
                                ，已索引 {record.indexedNestedResourceFieldCount} 个，可搜索字段名或 URL 展示隐藏项
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {record.decodedPreview && (
                      <div className="mt-1 font-mono text-cyan-200 truncate" title={record.decodedPreview}>
                        解析结果: {record.decodedPreview}
                      </div>
                    )}
                    {record.decodedPaths.length > 0 && (
                      <div className="mt-1.5 flex flex-col gap-1">
                        <div className="text-gray-500">
                          内部路径 · 显示 {record.decodedPaths.length}/{formatDecodedPathCount(record)} 条
                        </div>
                        {record.decodedPaths.map(row => (
                          <div
                            key={`${record.path}:${row.path}`}
                            data-tour="transform-report-decoded-path"
                            className="flex items-center justify-between gap-2 rounded bg-editor-bg px-2 py-1"
                          >
                            <div className="min-w-0 flex items-center gap-1 font-mono overflow-hidden">
                              <span className="min-w-0 flex-1 text-emerald-200 truncate" title={row.path}>
                                {row.path}
                              </span>
                              <span className="shrink-0 text-gray-500">=</span>
                              <span className="min-w-0 flex-1 text-cyan-200 truncate" title={row.preview}>
                                {row.preview}
                              </span>
                            </div>
                            <button
                              type="button"
                              data-tour="transform-report-copy-decoded-path"
                              onClick={() => handleCopyPath(row.path)}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制路径
                            </button>
                            <button
                              type="button"
                              data-tour="transform-report-copy-decoded-value"
                              onClick={() => handleCopyDecodedPathValue(getTransformDecodedPathCopyText(row))}
                              className="shrink-0 text-gray-400 hover:text-cyan-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                            >
                              复制片段
                            </button>
                            {onLocatePath && (
                              <button
                                type="button"
                                data-tour="transform-report-locate-decoded-path"
                                onClick={() => handleLocatePath(row.path)}
                                className="shrink-0 text-gray-400 hover:text-emerald-200 border border-editor-border px-2 py-0.5 rounded transition-colors"
                              >
                                定位
                              </button>
                            )}
                          </div>
                        ))}
                        {record.hasMoreDecodedPaths && (
                          <div data-tour="transform-report-more-decoded-paths" className="text-gray-500">
                            还有更多内部路径未展示，总计 {formatDecodedPathCount(record)} 条
                            {record.indexedDecodedPathCount > record.decodedPaths.length && (
                              <span>
                                ，已索引 {record.indexedDecodedPathCount} 条，可搜索字段名展示隐藏路径
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-1 font-mono text-gray-500 truncate" title={record.originalPreview}>
                      原始值: {record.originalPreview}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportView && reportView.filteredUnresolvedCount > 0 && (
              <div data-tour="transform-report-unresolved" className="flex flex-col gap-1.5">
                <div className="text-xs text-gray-500 font-medium">
                  未展开线索 · {reportView.filteredUnresolvedCount}
                  {reportView.isUnresolvedTruncated && (
                    <span className="text-amber-300 ml-2">仅显示前 {reportView.unresolvedCandidates.length} 条</span>
                  )}
                </div>
                {reportView.unresolvedCandidates.map(candidate => (
                  <div
                    key={`${candidate.path}:${candidate.length}:${candidate.detectedType || ''}`}
                    className="rounded border border-sky-700/50 bg-sky-900/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={candidate.sourceLabel} />
                        <span className="font-mono text-sky-200 truncate" title={candidate.path}>
                          {candidate.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        {candidate.detectedType && (
                          <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                            {candidate.detectedType}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyPath(candidate.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        <button
                          type="button"
                          data-tour="transform-report-copy-unresolved-value"
                          onClick={() => handleCopyOriginalValue(candidate.originalValue)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制原始值
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-unresolved-path"
                            onClick={() => handleLocatePath(candidate.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        {onOpenSchemeValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-unresolved-scheme"
                            onClick={() => handleOpenSchemeValue(candidate.originalValue)}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span
                        className={`rounded border px-2 py-0.5 ${
                          candidate.reasonLevel === 'warning'
                            ? 'border-amber-700/50 bg-amber-900/30 text-amber-200'
                            : 'border-sky-700/50 bg-sky-950/40 text-sky-200'
                        }`}
                      >
                        {candidate.reasonLabel}
                      </span>
                      <span className="text-gray-300">{candidate.message}</span>
                    </div>
                    <div className="mt-1 text-gray-400">
                      下一步: {candidate.nextAction}
                    </div>
                    <div className="mt-1 font-mono text-gray-500 truncate" title={candidate.preview}>
                      预览: {candidate.preview}
                    </div>
                    <div className="mt-1 text-gray-500">
                      {candidate.length} 字符
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportView && reportView.filteredPlaceholderCount > 0 && (
              <div data-tour="transform-report-placeholders" className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500 font-medium">
                    运行时占位符 · {reportView.filteredPlaceholderCount}
                    {reportView.isPlaceholderTruncated && (
                      <span className="text-amber-300 ml-2">仅显示前 {reportView.runtimePlaceholders.length} 条</span>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                    {onOpenTemplateFill && (
                      <button
                        type="button"
                        data-tour="transform-report-open-placeholder-fill-template"
                        onClick={handleOpenPlaceholderFillTemplate}
                        disabled={!placeholderFillTemplateJsonText || isFilterPending}
                        className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={getPlaceholderFillTemplateTitle('把当前筛选下的运行时占位符回填模板填入模板填充面板')}
                      >
                        填入模板填充
                      </button>
                    )}
                    <button
                      type="button"
                      data-tour="transform-report-copy-placeholder-fill-template"
                      onClick={handleCopyPlaceholderFillTemplate}
                      disabled={!placeholderFillTemplateJsonText || isFilterPending}
                      className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={getPlaceholderFillTemplateTitle('复制当前筛选下的运行时占位符回填模板')}
                    >
                      复制回填模板
                    </button>
                    <button
                      type="button"
                      data-tour="transform-report-copy-placeholders"
                      onClick={handleCopyPlaceholderReport}
                      disabled={isFilterPending}
                      className="text-xs text-gray-400 hover:text-violet-200 bg-editor-sidebar border border-editor-border px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isFilterPending ? '筛选结果仍在更新，请稍后复制占位符摘要' : '复制当前筛选下的运行时占位符摘要'}
                    >
                      复制占位符
                    </button>
                  </div>
                </div>
                <div data-tour="transform-report-placeholder-groups" className="grid gap-1.5">
                  {reportView.runtimePlaceholderGroups.map(group => (
                    <div
                      key={group.value}
                      className="rounded border border-violet-700/50 bg-violet-950/30 px-3 py-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          data-tour="transform-report-filter-placeholder-group"
                          onClick={() => setQuery(group.value)}
                          className="font-mono text-violet-100 hover:text-violet-50 underline decoration-violet-500/50 underline-offset-2 transition-colors"
                          title="按该占位符筛选报告"
                        >
                          {group.value}
                        </button>
                        <span className="rounded bg-editor-bg px-2 py-0.5 text-violet-200">
                          {group.count} 处
                        </span>
                        <span className="rounded bg-editor-bg px-2 py-0.5 text-gray-300">
                          {group.sourceCount} 个来源
                        </span>
                      </div>
                      <div className="mt-1 text-gray-300">{group.description}</div>
                      <div className="mt-1 flex flex-col gap-1">
                        {group.sources.slice(0, 3).map(source => (
                          <div
                            key={`${group.value}:${source.sourcePath}`}
                            className="min-w-0 font-mono text-gray-500 truncate"
                            title={source.sourceOriginalPreview || source.sourcePath}
                          >
                            来源{source.sourceLabel ? ` ${source.sourceLabel}` : ''} ×{source.count}: {source.sourcePath}
                          </div>
                        ))}
                        {group.sources.length > 3 && (
                          <div className="text-gray-500">
                            还有 {group.sources.length - 3} 个来源
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {reportView.runtimePlaceholders.map(placeholder => (
                  <div
                    key={`${placeholder.path}:${placeholder.value}`}
                    className="rounded border border-violet-700/50 bg-violet-900/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={placeholder.sourceLabel} />
                        <span className="font-mono text-violet-200 truncate" title={placeholder.path}>
                          {placeholder.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                          {placeholder.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPath(placeholder.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-placeholder-path"
                            onClick={() => handleLocatePath(placeholder.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        <button
                          type="button"
                          data-tour="transform-report-copy-placeholder-source-path"
                          onClick={() => handleCopyPath(placeholder.sourcePath, '已复制来源路径')}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制来源
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-placeholder-source"
                            onClick={() => handleLocatePath(placeholder.sourcePath)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位来源
                          </button>
                        )}
                        {placeholder.sourceOriginalValue && (
                          <button
                            type="button"
                            data-tour="transform-report-copy-placeholder-source-value"
                            onClick={() => handleCopyOriginalValue(placeholder.sourceOriginalValue || '', '已复制来源值')}
                            className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            复制来源值
                          </button>
                        )}
                        {onOpenSchemeValue && placeholder.sourceOriginalValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-placeholder-source-scheme"
                            onClick={() => handleOpenSchemeValue(placeholder.sourceOriginalValue || '')}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开来源
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-gray-300">{placeholder.description}</div>
                    <div className="mt-1 font-mono text-gray-500 truncate" title={placeholder.sourcePath}>
                      来源: {placeholder.sourcePath}
                    </div>
                    {placeholder.sourceOriginalPreview && (
                      <div
                        className="mt-1 font-mono text-gray-500 truncate"
                        title={placeholder.sourceOriginalPreview}
                      >
                        来源原始值: {placeholder.sourceOriginalPreview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {reportView && reportView.filteredWarningCount > 0 && (
              <div data-tour="transform-report-warnings" className="flex flex-col gap-1.5">
                <div className="text-xs text-gray-500 font-medium">
                  跳过记录 · {reportView.filteredWarningCount}
                  {reportView.isWarningTruncated && (
                    <span className="text-amber-300 ml-2">仅显示前 {reportView.warnings.length} 条</span>
                  )}
                </div>
                {reportView.warnings.map(warning => (
                  <div
                    key={`${warning.path}:${warning.length}:${warning.limit}`}
                    className="rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <SourceLabelBadge label={warning.sourceLabel} />
                        <span className="font-mono text-amber-200 truncate" title={warning.path}>
                          {warning.path}
                        </span>
                      </div>
                      <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          data-tour="transform-report-warning-copy-path"
                          onClick={() => handleCopyPath(warning.path)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制路径
                        </button>
                        <button
                          type="button"
                          data-tour="transform-report-warning-copy-value"
                          onClick={() => handleCopyOriginalValue(warning.originalValue)}
                          className="text-gray-400 hover:text-cyan-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                        >
                          复制原始值
                        </button>
                        {onLocatePath && (
                          <button
                            type="button"
                            data-tour="transform-report-locate-warning-path"
                            onClick={() => handleLocatePath(warning.path)}
                            className="text-gray-400 hover:text-emerald-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            定位
                          </button>
                        )}
                        {onOpenSchemeValue && (
                          <button
                            type="button"
                            data-tour="transform-report-open-warning-scheme"
                            onClick={() => handleOpenSchemeValue(warning.originalValue)}
                            className="text-gray-400 hover:text-violet-200 bg-editor-bg border border-editor-border px-2 py-0.5 rounded transition-colors"
                          >
                            Scheme 打开
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="rounded border border-amber-700/50 bg-amber-900/30 px-2 py-0.5 text-amber-200">
                        {warning.reasonLabel}
                      </span>
                      <span className="text-gray-300">{warning.message}</span>
                    </div>
                    <div className="mt-1 text-gray-400">
                      下一步: {warning.nextAction}
                    </div>
                    <div className="mt-1 text-gray-500">
                      {warning.length} 字符，阈值 {warning.limit}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reportView &&
              reportView.filteredRecordCount === 0 &&
              reportView.filteredPlaceholderCount === 0 &&
              reportView.filteredUnresolvedCount === 0 &&
              reportView.filteredWarningCount === 0 && (
              <div
                data-tour="transform-report-empty"
                className="rounded border border-editor-border bg-editor-sidebar p-4 text-center text-xs text-gray-500"
              >
                <div>{query ? '没有匹配的解析记录' : '本次深度格式化没有展开嵌套字符串'}</div>
                {query && (
                  <button
                    type="button"
                    data-tour="transform-report-empty-clear"
                    onClick={() => setQuery('')}
                    className="mt-2 rounded border border-editor-border bg-editor-bg px-2.5 py-1 text-gray-300 transition-colors hover:border-cyan-700 hover:text-cyan-100"
                  >
                    清空筛选
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DraggablePanel>
  );
};
