import {
  scoreScorecardDimensions,
  selectScorecardNextFocus,
  summarizeScorecardStatus,
} from './aiGovernanceMaturityScorecardScoring.mjs';
import { buildAiGovernanceMaturityScorecardDimensions } from './aiGovernanceMaturityScorecardDimensions.mjs';

const SCORECARD_SCHEMA_VERSION = 1;

export const buildAiGovernanceMaturityScorecard = reports => {
  const dimensions = buildAiGovernanceMaturityScorecardDimensions(reports);
  return {
    schemaVersion: SCORECARD_SCHEMA_VERSION,
    reportType: 'ai-governance-maturity-scorecard',
    score: scoreScorecardDimensions(dimensions),
    status: summarizeScorecardStatus(dimensions),
    nextFocus: selectScorecardNextFocus(dimensions),
    dimensions,
  };
};
