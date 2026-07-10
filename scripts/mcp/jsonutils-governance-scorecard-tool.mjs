import { buildJsonutilsGovernanceContext } from './jsonutils-governance-context.mjs';

export const buildJsonutilsGovernanceScorecardToolPayload = async ({ top = 35, runScript }) => {
  const context = await buildJsonutilsGovernanceContext({ top, runScript });
  return {
    ok: context.ok,
    scorecard: {
      schemaVersion: 1,
      reportType: 'jsonutils-governance-scorecard',
      ok: context.ok,
      project: context.project,
      maturityScorecard: context.maturityScorecard,
      nextCommands: context.nextCommands,
    },
  };
};
