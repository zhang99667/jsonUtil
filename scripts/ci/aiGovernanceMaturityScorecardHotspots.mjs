const AI_INFRA_PATTERN = /^(scripts\/ci\/(aiGovernance|write-ai-governance-artifacts|writeAiGovernanceArtifact)|scripts\/ci\/maintainability-budget-governance-ai-|scripts\/mcp\/|\.codex\/skills\/|docs\/AI-|rules\/ai-|\.mcp\.json|\.cursor\/mcp\.json|\.vscode\/mcp\.json)/;
const CAPACITY_REVIEW_PATTERNS = [
  /^scripts\/ci\/maintainability-budget-.*-rules\.mjs$/,
  /^scripts\/ci\/aiGovernanceRequired[A-Za-z0-9]*Files\.mjs$/,
  /(?:TestFixtures|MissingCases)\.mjs$/,
];

const hotspotFile = hotspot => hotspot?.file ?? 'unknown';
const isAiInfraHotspot = item => AI_INFRA_PATTERN.test(hotspotFile(item));
const isAiInfraCandidate = item => isAiInfraHotspot(item) && (item.remainingLines <= 5 || item.usageRatio >= 0.85);
const isCapacityReviewCandidate = item => CAPACITY_REVIEW_PATTERNS.some(pattern => pattern.test(hotspotFile(item)));
const isTestCandidate = item => /\.test\.[cm]?[jt]sx?$/.test(hotspotFile(item));

const selectPriority = ({ responsibilityRisky, responsibilityCandidates, capacityRisky, capacityCandidates, risky }) => {
  const [item, action] = [
    [responsibilityRisky.find(candidate => !isTestCandidate(candidate)), 'responsibility-review'],
    [responsibilityRisky.find(isTestCandidate), 'responsibility-review'],
    [responsibilityCandidates.find(candidate => !isTestCandidate(candidate)), 'responsibility-review'],
    [responsibilityCandidates.find(isTestCandidate), 'responsibility-review'],
    [capacityRisky[0], 'capacity-review'],
    [capacityCandidates[0], 'capacity-review'],
    [risky[0], 'domain-budget-review'],
  ].find(([candidate]) => candidate) ?? [];
  return item ? { file: hotspotFile(item), action } : null;
};

const nextActionFor = (priority) => {
  if (!priority) return '补充可维护性预算 JSON 报告';
  if (priority.action === 'responsibility-review') {
    return `优先审计 ${priority.file} 的职责与覆盖；仅发现独立职责后拆分`;
  }
  if (priority.action === 'capacity-review') {
    return `AI 基建候选仅剩容量复核项；复核 ${priority.file} 的单一表/fixture 边界并校准余量，不机械拆分`;
  }
  return 'AI 基建候选已清零；普通热点交给对应领域预算处理';
};

export const buildMaintainabilityHotspotSummary = (report) => {
  const highUsage = report?.items?.highUsage ?? [];
  const factCandidates = report?.items?.scorecardCandidates ?? highUsage;
  const risky = factCandidates.filter(item => item.remainingLines <= 2 || item.usageRatio >= 0.95);
  const aiCandidates = factCandidates.filter(isAiInfraCandidate);
  const aiRisky = risky.filter(isAiInfraHotspot);
  const responsibilityCandidates = aiCandidates.filter(item => !isCapacityReviewCandidate(item));
  const capacityReviewCandidates = aiCandidates.filter(isCapacityReviewCandidate);
  const priority = selectPriority({
    responsibilityRisky: aiRisky.filter(item => !isCapacityReviewCandidate(item)),
    responsibilityCandidates,
    capacityRisky: aiRisky.filter(isCapacityReviewCandidate),
    capacityCandidates: capacityReviewCandidates,
    risky,
  });
  return {
    riskyCount: risky.length,
    aiCandidateCount: aiCandidates.length,
    responsibilityCandidateCount: responsibilityCandidates.length,
    capacityReviewCandidateCount: capacityReviewCandidates.length,
    aiInfraCleared: aiCandidates.length === 0,
    ordinaryRiskyCount: risky.length - aiRisky.length,
    priority,
    nextAction: nextActionFor(priority),
  };
};
