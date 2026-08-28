import {
  scoreScorecardDimensions,
  selectScorecardNextFocus,
  summarizeScorecardStatus,
} from './aiGovernanceMaturityScorecardScoring.mjs';
import { buildAiGovernanceMaturityScorecardDimensions } from './aiGovernanceMaturityScorecardDimensions.mjs';

const SCORECARD_SCHEMA_VERSION = 2;

const orderFocusCandidates = (dimensions, reports) => {
  const evolutionReport = reports?.governanceReport?.evolutionEvals
    ?? reports?.governanceReport?.evolutionEvalReport;
  const behavior = dimensions.find(item => item.id === 'behavior-quality');
  if (behavior?.status !== 'warn'
    || evolutionReport?.nextFocus?.reasonCode !== 'external-execution-required') return dimensions;
  return [...dimensions.filter(item => item !== behavior), behavior];
};

export const buildAiGovernanceMaturityScorecard = reports => {
  const dimensions = buildAiGovernanceMaturityScorecardDimensions(reports);
  return {
    schemaVersion: SCORECARD_SCHEMA_VERSION,
    reportType: 'ai-governance-maturity-scorecard',
    score: scoreScorecardDimensions(dimensions),
    status: summarizeScorecardStatus(dimensions),
    nextFocus: selectScorecardNextFocus(orderFocusCandidates(dimensions, reports)),
    dimensions,
  };
};
