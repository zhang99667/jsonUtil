import { createHash } from 'node:crypto';

import { isEvolutionRecord } from './aiGovernanceEvolutionEvalContract.mjs';
import {
  parseRegistrationCanaryGradeCheckpointRequest,
  verifyRegistrationCanaryGradeCheckpointRequest,
} from './aiGovernanceRegistrationCanaryGradeCheckpointRequest.mjs';
import {
  unblindRegistrationCanaryGradeSet,
} from './aiGovernanceRegistrationCanaryReview.mjs';

const exactFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : [`${label} 必须是闭字段对象`];
};
const sha256 = value => createHash('sha256').update(value).digest('hex');

export const bindRegistrationCanaryReviewToCheckpoint = (input) => {
  const inputFailures = exactFields(input, [
    'requestJson', 'packetBundles', 'blindGrades', 'gradeSet', 'hostRunRecords',
    'caseItem', 'experimentRef', 'policyEntry', 'expectedFixtureRevision',
  ], 'checkpoint bind input');
  if (inputFailures.length > 0) throw new TypeError(inputFailures.join('；'));
  const {
    requestJson,
    packetBundles,
    blindGrades,
    gradeSet,
    hostRunRecords,
    caseItem,
    experimentRef,
    policyEntry,
    expectedFixtureRevision,
  } = input;
  const request = parseRegistrationCanaryGradeCheckpointRequest(requestJson);
  verifyRegistrationCanaryGradeCheckpointRequest({
    request,
    gradeSet,
    blindGrades,
    caseItem,
    experimentRef,
    policyEntry,
    expectedFixtureRevision,
  });
  const review = unblindRegistrationCanaryGradeSet({
    packetBundles,
    blindGrades,
    gradeSet,
    hostRunRecords,
    expectedFixtureRevision,
  });
  const reviewRefs = review.trials.map(trial => ({
    blindTrialAlias: trial.blindTrialAlias,
    resultSha256: trial.resultSha256,
    gradeSha256: trial.gradeSha256,
  })).sort((left, right) => left.blindTrialAlias.localeCompare(right.blindTrialAlias));
  if (review.status !== 'review-only'
    || review.gradeSetSha256 !== request.gradeSet.commitmentSha256
    || review.experimentRef?.id !== request.experimentRef.id
    || review.experimentRef?.manifestVersion !== request.experimentRef.manifestVersion
    || JSON.stringify(reviewRefs) !== JSON.stringify(request.gradeSet.refs)) {
    throw new TypeError('checkpoint 与重建 review 的 grade set、experiment 或 trial refs 不匹配');
  }
  return {
    ...review,
    checkpoint: {
      requestSha256: sha256(Buffer.from(requestJson, 'utf8')),
      anchorStatus: request.anchor.status,
      trustedSigners: request.trust.trustedSigners,
      identityVerified: request.trust.identityVerified,
      timestampVerified: request.trust.timestampVerified,
      inclusionVerified: request.trust.inclusionVerified,
      phaseOrderingVerified: request.trust.phaseOrderingVerified,
      nonReplaceabilityVerified: request.trust.nonReplaceabilityVerified,
    },
    writebackCandidate: {
      status: 'blocked',
      reasonCode: 'external-checkpoint-required',
      schemaUpgradeRequired: true,
      automaticWrite: false,
    },
  };
};
