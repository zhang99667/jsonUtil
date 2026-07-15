const dimensionStatus = (context, id, fallback) => (
  context.maturityScorecard.dimensions?.find(item => item.id === id)?.status ?? fallback
);

export const buildAiGovernanceArtifactSummary = (context, { generatedAt } = {}) => [
  '### AI Governance',
  generatedAt ? `- Generated: ${generatedAt}` : null,
  `- Project: ${context.project.name} ${context.project.version}`,
  `- Governance: ${context.governance.ok ? 'pass' : 'fail'}`,
  `- Behavior evals: ${context.evolution?.counts?.coveredCases ?? 0}/${context.evolution?.counts?.behaviorCases ?? context.evolution?.counts?.cases ?? 0} behavior cases with outcomes; ${context.evolution?.counts?.componentBoundaryCases ?? 0} component-boundary cases excluded`,
  `- Learning: ${context.evolution?.counts?.openFeedbackSignals ?? 0} open signals; ${context.evolution?.counts?.experiments ?? 0} experiments; ${context.evolution?.counts?.plannedExperimentTrials ?? 0} planned trials`,
  `- Distribution failures: workspace=${context.distributionReadiness?.scopes?.workspace?.counts?.failures ?? 'unknown'}; index=${context.distributionReadiness?.scopes?.index?.counts?.failures ?? 'unknown'}; HEAD=${context.distributionReadiness?.scopes?.head?.counts?.failures ?? 'unknown'}; clone-ready=${context.distributionReadiness ? (context.distributionReadiness.readiness?.clone ? 'yes' : 'no') : 'unknown'}`,
  `- Maintainability: ${dimensionStatus(context, 'maintainability-headroom', context.maintainability.ok ? 'pass' : 'fail')}`,
  `- Maturity score: ${context.maturityScorecard.score}/100 (${context.maturityScorecard.status})`,
  `- Next focus: ${context.maturityScorecard.nextFocus?.nextAction ?? context.maturityScorecard.nextFocus?.label ?? 'none'}`,
  `- Latest decision: ${context.project.latestDecision?.date ?? '-'} ${context.project.latestDecision?.decision ?? '-'}`,
  `- High usage: ${context.maintainability.highUsage.map(item => item.file).join(', ') || 'none'}`,
  '',
].filter(line => line !== null).join('\n');
