import { transformSummaryMaintainabilityBudgets } from './maintainability-budget-transform-summary-rules.mjs';
import { transformFilterMaintainabilityBudgets } from './maintainability-budget-transform-filter-rules.mjs';
import { transformJsonObjectMaintainabilityBudgets } from './maintainability-budget-transform-json-object-rules.mjs';
import { transformPlaceholderMaintainabilityBudgets } from './maintainability-budget-transform-placeholder-rules.mjs';
import { transformQualityMaintainabilityBudgets } from './maintainability-budget-transform-quality-rules.mjs';

export const transformCoreMaintainabilityBudgets = [
  ...transformSummaryMaintainabilityBudgets,
  ...transformFilterMaintainabilityBudgets,
  ...transformJsonObjectMaintainabilityBudgets,
  ...transformPlaceholderMaintainabilityBudgets,
  ...transformQualityMaintainabilityBudgets,
  { file: 'frontend/src/utils/transformations.ts', maxLines: 950, reason: '核心转换只维护格式识别、正反转换和上下文编排，新增职责应拆入独立纯函数模块' },
  { file: 'frontend/src/utils/jsonInputParser.ts', maxLines: 120, reason: 'JSON 输入与常见复制外壳识别应保持惰性匹配的纯解析模块' },
  {
    file: 'frontend/src/utils/transformations.test.ts',
    maxLines: 1410,
    reason: '核心转换测试锁定格式识别、正反转换和深度解析兼容边界，新增领域测试应独立分文件',
  },
  {
    file: 'frontend/src/utils/transformationsUrlDisplayHeader.test.ts',
    maxLines: 100,
    reason: 'URL 来源展示测试只锁定普通链接保护、来源字段冲突、逆变换和嵌套标记',
  },
  {
    file: 'frontend/src/utils/transformIssueClassification.ts',
    maxLines: 90,
    reason: '深度解析待检查和跳过原因分类应保持纯文案策略，避免回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformWarningClassification.ts',
    maxLines: 40,
    reason: '深度解析性能保护 warning 分类应独立于待检查候选分类',
  },
  {
    file: 'frontend/src/utils/transformArchiveSanitizers.ts',
    maxLines: 60,
    reason: '深度解析归档包脱敏规则应保持纯函数，避免回流到报告聚合文件',
  },
  {
    file: 'frontend/src/utils/transformValuePreview.ts',
    maxLines: 80,
    reason: '深度解析值预览格式化应保持纯函数小模块',
  },
  {
    file: 'frontend/src/utils/transformSuggestedCommands.ts',
    maxLines: 80,
    reason: '深度解析建议命令应保持纯数据和简单去重',
  },
  {
    file: 'frontend/src/utils/staticResourceSchema.ts',
    maxLines: 220,
    reason: '静态资源识别规则应保持纯函数小模块',
  },
  {
    file: 'frontend/src/utils/resourcePathType.ts',
    maxLines: 20,
    reason: '资源路径后缀分类只维护闭集扩展名与类型映射',
  },
  {
    file: 'frontend/src/utils/issueSampleRedaction.ts',
    maxLines: 220,
    reason: '协作样本脱敏规则应保持可审计小模块',
  },
  {
    file: 'frontend/src/utils/jsonPathFocus.ts',
    maxLines: 240,
    reason: '聚焦路径投影逻辑应保持纯函数小模块',
  },
];
