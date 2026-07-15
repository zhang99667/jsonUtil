import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { prepareRegistrationCanaryProjection } from './prepare-ai-registration-canary.mjs';

export const REGISTRATION_CANARY_SNAPSHOT_PROJECTIONS = Object.freeze(['agent', 'grader', 'host']);

export const digestRegistrationCanarySnapshotFixture = value => createHash('sha256')
  .update(value).digest('hex');

export const removeRegistrationCanarySnapshotFixture = (target) => {
  if (!fs.existsSync(target)) return;
  const makeWritable = (current) => {
    const stat = fs.lstatSync(current);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      fs.chmodSync(current, 0o700);
      fs.readdirSync(current).forEach(name => makeWritable(path.join(current, name)));
    } else if (!stat.isSymbolicLink()) fs.chmodSync(current, 0o600);
  };
  makeWritable(target);
  fs.rmSync(target, { recursive: true, force: true });
};

export const buildRegistrationCanarySnapshotBundle = (projectRoot, args) => Object.fromEntries(
  REGISTRATION_CANARY_SNAPSHOT_PROJECTIONS.map(projection => [
    projection,
    prepareRegistrationCanaryProjection({
      projectRoot,
      argv: [
        '--trial', args.trialId,
        '--projection', projection,
        '--run-nonce', args.runNonce,
        '--environment-sha256', args.environmentSha256,
      ],
    }),
  ]),
);

export const buildRegistrationCanarySnapshotScorecardCall = (scorecardOk) => {
  const scorecard = {
    reportType: 'jsonutils-governance-scorecard',
    ok: scorecardOk,
    privateDetail: 'secret',
    maturityScorecard: {
      reportType: 'ai-governance-maturity-scorecard',
      nextFocus: { id: 'focus' },
    },
  };
  return {
    isError: !scorecardOk,
    content: [{ type: 'text', text: JSON.stringify(scorecard) }],
    structuredContent: scorecard,
  };
};
