const AI_INFRA_PATTERN = /^(scripts\/ci\/(aiGovernance|write-ai-governance-artifacts|writeAiGovernanceArtifact)|scripts\/ci\/maintainability-budget-governance-ai-|scripts\/mcp\/|\.codex\/skills\/|docs\/AI-|rules\/ai-|\.mcp\.json|\.cursor\/mcp\.json|\.vscode\/mcp\.json)/;

const hotspotFile = hotspot => hotspot?.file ?? 'unknown';
const isAiInfraHotspot = item => AI_INFRA_PATTERN.test(hotspotFile(item));

export const buildMaintainabilityHotspotSummary = (report) => {
  const highUsage = report?.items?.highUsage ?? [];
  const risky = highUsage.filter(item => item.remainingLines <= 2 || item.usageRatio >= 0.95);
  const aiCandidates = highUsage.filter(isAiInfraHotspot);
  const aiRisky = risky.filter(isAiInfraHotspot);
  const priorityHotspot = aiRisky[0] ?? aiCandidates[0] ?? risky[0];
  return {
    riskyCount: risky.length,
    aiCandidateCount: aiCandidates.length,
    aiInfraCleared: aiCandidates.length === 0,
    ordinaryRiskyCount: risky.length - aiRisky.length,
    nextAction: priorityHotspot
      ? (aiCandidates.length > 0
          ? `优先拆分 ${hotspotFile(priorityHotspot)}`
          : 'AI 基建候选已清零；普通热点交给对应领域预算处理')
      : '补充可维护性预算 JSON 报告',
  };
};
