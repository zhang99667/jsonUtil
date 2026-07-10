export const buildAiGovernanceArtifactSummary = (context, { generatedAt } = {}) => [
  '### AI Governance',
  generatedAt ? `- Generated: ${generatedAt}` : null,
  `- Project: ${context.project.name} ${context.project.version}`,
  `- Governance: ${context.governance.ok ? 'pass' : 'fail'}`,
  `- Maintainability: ${context.maintainability.ok ? 'pass' : 'fail'}`,
  `- Maturity score: ${context.maturityScorecard.score}/100 (${context.maturityScorecard.status})`,
  `- Next focus: ${context.maturityScorecard.nextFocus?.nextAction ?? context.maturityScorecard.nextFocus?.label ?? 'none'}`,
  `- Latest decision: ${context.project.latestDecision?.date ?? '-'} ${context.project.latestDecision?.decision ?? '-'}`,
  `- High usage: ${context.maintainability.highUsage.map(item => item.file).join(', ') || 'none'}`,
  '',
].filter(line => line !== null).join('\n');
