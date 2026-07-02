const schemeViewerDiagnosticsComponentBudget = (file, maxLines, reason) => ({
  file: `frontend/src/components/${file}`,
  maxLines,
  reason,
});

export const schemeViewerDiagnosticsComponentMaintainabilityBudgets = [
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDiagnosticsPanel.tsx', 170, 'Scheme 诊断容器只装配摘要、详情折叠和子面板，不承载解码或复制副作用'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDiagnosticsPanel.test.tsx', 220, 'Scheme 诊断容器测试只覆盖折叠、展开和子面板透传'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDiagnosticsPanelTestFixture.ts', 125, 'Scheme 诊断容器测试夹具只维护默认样本和渲染入口，避免测试断言被样板淹没'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerSchemeInfoRow.tsx', 60, 'Scheme 协议信息行只负责 protocol、host 和 path 的紧凑展示'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerSchemeInfoRow.test.tsx', 55, 'Scheme 协议信息行测试只覆盖空态、字段展示和截断 title'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDiagnosticsSummaryBar.tsx', 70, 'Scheme 诊断顶部摘要条只负责紧凑展示解析质量和摘要 chips'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDiagnosticsSummaryBar.test.tsx', 95, 'Scheme 诊断顶部摘要条测试只覆盖紧凑展示和展开回调'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDiagnosticsQualityCard.tsx', 100, 'Scheme 诊断质量卡片只负责质量说明、指标 chips 和复制/排查按钮'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDiagnosticsQualityCard.test.tsx', 105, 'Scheme 诊断质量卡片测试只覆盖空态、文案和按钮回调'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDecodeWarningsPanel.tsx', 55, 'Scheme 解码性能护栏面板只负责跳过提示和路径展示'),
  schemeViewerDiagnosticsComponentBudget('SchemeViewerDecodeWarningsPanel.test.tsx', 70, 'Scheme 解码性能护栏面板测试只覆盖空态、跳过计数和路径展示'),
];
