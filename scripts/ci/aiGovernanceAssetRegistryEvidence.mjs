export const AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS = [
  '必需文件',
  '入口引用规则',
  'docs/AI 引用规则',
  '工具入口引用规则',
  'PR 模板引用规则',
  'Claude README 引用规则',
  'skill 引用规则',
  '发布引用规则',
  '运行时引用规则',
  '自动发现规则',
  '资产发现规则',
  '同源章节漂移检查',
  '同源片段漂移检查',
  '章节级引用检查',
  'Codex skill 契约检查',
  '资产注册表结构化校验',
  '显式豁免列表',
  '可维护性预算',
  '版本一致性检查引用',
];

const FILE_REFERENCE_EVIDENCE_MARKERS = [
  '入口引用规则',
  'docs/AI 引用规则',
  '工具入口引用规则',
  'PR 模板引用规则',
  'Claude README 引用规则',
  'skill 引用规则',
];

const splitEvidenceMarkers = evidence => evidence
  .split(/[、，,；;|]/)
  .map(marker => marker.trim())
  .filter(Boolean);

export const hasRecognizedGovernanceEvidence = evidence => splitEvidenceMarkers(evidence)
  .some(marker => AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS.includes(marker));

export const collectUnknownGovernanceEvidenceMarkers = evidence => splitEvidenceMarkers(evidence)
  .filter(marker => !AI_GOVERNANCE_ASSET_REGISTRY_EVIDENCE_MARKERS.includes(marker));

const buildEvidenceSourceChecks = context => [
  { marker: '必需文件', files: context.requiredFiles },
  { marker: '自动发现规则', files: context.discoveredFiles },
  { marker: '资产发现规则', files: context.discoveredFiles },
  { marker: '显式豁免列表', files: context.exemptFiles },
  ...FILE_REFERENCE_EVIDENCE_MARKERS.map(marker => ({ marker, files: context.referenceRuleFiles })),
];

export const collectUnsupportedGovernanceEvidence = (file, evidence, context) => {
  const markers = splitEvidenceMarkers(evidence);
  return buildEvidenceSourceChecks(context)
    .filter(({ marker, files }) => markers.includes(marker) && !files.has(file))
    .map(({ marker }) => marker);
};
