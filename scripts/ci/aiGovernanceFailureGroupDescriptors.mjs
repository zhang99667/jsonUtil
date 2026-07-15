export const AI_GOVERNANCE_FAILURE_GROUPS = [
  ['missingFiles', 'AI 协作资产缺少以下文件:'],
  ['skillContractFailures', 'AI 协作 skill 契约缺少以下内容:'],
  ['contractFailures', 'AI 协作治理契约失败:'],
  ['evolutionEvidenceFailures', 'AI 行为评测证据需要处理:'],
  ['missingReferences', 'AI 协作资产缺少以下关键引用:'],
];

export const AI_GOVERNANCE_FAILURE_KEYS = AI_GOVERNANCE_FAILURE_GROUPS.map(([key]) => key);

export const hasAiGovernanceFailures = report => (
  AI_GOVERNANCE_FAILURE_KEYS.some(key => (report[key]?.length ?? 0) > 0)
);
