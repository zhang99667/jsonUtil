import { schemeViewerDiagnosticsComponentMaintainabilityBudgets } from './maintainability-budget-scheme-viewer-diagnostics-component-rules.mjs';

const schemeViewerDetailComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerDetailComponentMaintainabilityBudgets = [
  schemeViewerDetailComponentBudget('SchemeViewerParamSectionsPanel.tsx', 75, 'Scheme 参数来源面板只负责 Query/Hash 参数预览，参数采集和计数规则留在诊断 helper'),
  schemeViewerDetailComponentBudget('SchemeViewerParamSectionsPanel.test.tsx', 85, 'Scheme 参数来源面板测试只覆盖空态、计数、展示上限和参数预览截断'),
  schemeViewerDetailComponentBudget('SchemeViewerParamStagesPanel.tsx', 115, 'Scheme 参数分层面板只负责 Raw/URL Decode/JSON-CMD/重编码证据展示，解码规则留在解析层'),
  schemeViewerDetailComponentBudget('SchemeViewerParamStagesPanel.test.tsx', 110, 'Scheme 参数分层面板测试只覆盖空态、链路摘要、修复提示、展示上限和可回写状态'),
  schemeViewerDetailComponentBudget('SchemeViewerDecodeLayersPanel.tsx', 120, 'Scheme 解码链路面板只负责层级证据展示，层级生成和编码可逆性规则留在解析层'),
  schemeViewerDetailComponentBudget('SchemeViewerDecodeLayersPanel.test.tsx', 115, 'Scheme 解码链路面板测试只覆盖空态、目标类型、层级展示和 after 内容 fallback'),
  ...schemeViewerDiagnosticsComponentMaintainabilityBudgets,
];
