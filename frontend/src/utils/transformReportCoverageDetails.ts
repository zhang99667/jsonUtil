import type {
  TransformReportCoverage,
  TransformReportCoverageSummary,
} from './transformReportCoverageTypes';

export const buildTransformReportWarningCoverage = (
  score: number,
  warningCount: number
): TransformReportCoverage => ({
  score,
  label: `解析覆盖 ${score}%`,
  level: 'warning',
  description: `有 ${warningCount} 条内容被性能保护跳过，真实 response 可能仍有未展开字段。`,
  items: [
    '优先查看跳过记录，必要时复制路径定位源字段',
    '超长字段可单独粘贴到 Scheme 面板继续拆解',
  ],
});

export const buildTransformReportUnresolvedCoverage = (
  score: number,
  unresolvedCount: number
): TransformReportCoverage => ({
  score,
  label: `解析覆盖 ${score}%`,
  level: 'info',
  description: `还有 ${unresolvedCount} 条疑似结构化内容未完全展开，需要判断是普通文本还是规则缺口。`,
  items: [
    '优先看未展开线索的原因标签和下一步建议',
    '如果字段应继续拆解，可保留原始值补充解析样本',
  ],
});

export const buildTransformReportPlaceholderCoverage = (
  score: number,
  { recordCount, placeholderCount }: TransformReportCoverageSummary
): TransformReportCoverage => ({
  score,
  label: recordCount > 0
    ? `结构解析完成 · 占位符 ${placeholderCount}`
    : `运行时占位符 ${placeholderCount}`,
  level: 'info',
  description: `已展开当前可解析结构，但仍有 ${placeholderCount} 个运行时占位符需要服务端或客户端替换。`,
  items: [
    '占位符不是解析失败，可筛选占位符查看待替换字段',
    '复制来源路径可回到原始 CMD/Scheme 字段排查',
  ],
});

export const buildTransformReportSuccessCoverage = (
  score: number,
  recordCount: number
): TransformReportCoverage => ({
  score,
  label: `解析覆盖 ${score}%`,
  level: 'success',
  description: recordCount > 0
    ? '本次未发现待检查线索、性能跳过或运行时占位符。'
    : '本次没有需要展开的嵌套字符串。',
  items: [],
});
