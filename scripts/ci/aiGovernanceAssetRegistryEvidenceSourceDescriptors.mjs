const referenceRuleEvidenceMarkers = ['入口引用规则', 'docs/AI 引用规则', '工具入口引用规则', 'PR 模板引用规则', 'Claude README 引用规则', 'skill 引用规则'];

export const EVIDENCE_SOURCE_DESCRIPTORS = [
  ['必需文件', 'requiredFiles'],
  ['发布引用规则', 'releaseReferenceFiles'],
  ['运行时引用规则', 'runtimeReferenceFiles'],
  ['同源章节漂移检查', 'mirroredSectionFiles'],
  ['同源片段漂移检查', 'mirroredSnippetFiles'],
  ['章节级引用检查', 'sectionReferenceFiles'],
  ['Codex skill 契约检查', 'skillContractFiles'],
  ['资产注册表结构化校验', 'assetRegistryStructuredFiles'],
  ['显式豁免列表', 'exemptFiles'],
  ['可维护性预算', 'maintainabilityBudgetFiles'],
  ['版本一致性检查引用', 'versionConsistencyReferenceFiles'],
  ['自动发现规则', 'discoveredFiles'],
  ['资产发现规则', 'discoveredFiles'],
  ...referenceRuleEvidenceMarkers.map(marker => [marker, 'referenceRuleFiles']),
];
