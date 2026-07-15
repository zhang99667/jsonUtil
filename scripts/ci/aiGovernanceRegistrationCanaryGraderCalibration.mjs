import path from 'node:path';

import { isEvolutionRecord } from './aiGovernanceEvolutionEvalContract.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';
import {
  buildRegistrationCanaryCalibrationFixtureContext,
  buildRegistrationCanaryCalibrationInput,
} from './aiGovernanceRegistrationCanaryCalibrationFixtures.mjs';
import {
  REGISTRATION_CANARY_GRADER_CALIBRATION_LABELS,
  REGISTRATION_CANARY_GRADER_CALIBRATION_PATH,
  readRegistrationCanaryGraderCalibration,
} from './aiGovernanceRegistrationCanaryGraderCalibrationContract.mjs';
import { gradeRegistrationCanaryResultBlind } from './aiGovernanceRegistrationCanaryResult.mjs';

export { readRegistrationCanaryGraderCalibration } from './aiGovernanceRegistrationCanaryGraderCalibrationContract.mjs';

const LABELS = REGISTRATION_CANARY_GRADER_CALIBRATION_LABELS;
const equalReasonCodes = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
const ratio = (numerator, denominator) => denominator === 0 ? 0 : numerator / denominator;

const normalizeGrade = (grade) => {
  if (!isEvolutionRecord(grade?.grade) || !Array.isArray(grade?.reasonCodes)) {
    return { label: 'invalid-grader-output', reasonCodes: ['invalid-grader-output'] };
  }
  if (grade.grade.status === 'graded' && grade.grade.verdict === 'pass' && grade.grade.score === 100) {
    return { label: 'pass', reasonCodes: [...grade.reasonCodes] };
  }
  if (grade.grade.status === 'graded' && grade.grade.verdict === 'fail' && grade.grade.score === 0) {
    return { label: 'behavior-fail', reasonCodes: [...grade.reasonCodes] };
  }
  if (grade.grade.status === 'ungradable' && grade.grade.verdict === null && grade.grade.score === null) {
    return { label: 'infrastructure-invalid', reasonCodes: [...grade.reasonCodes] };
  }
  return { label: 'invalid-grader-output', reasonCodes: ['invalid-grader-output'] };
};

const gradeCalibrationInput = (gradeResult, input) => {
  try {
    return normalizeGrade(gradeResult(input));
  } catch {
    return { label: 'input-rejected', reasonCodes: ['input-rejected'] };
  }
};

const calculateMacroF1 = (labels, samples) => labels.reduce((sum, label) => {
  const truePositive = samples.filter(item => item.expected === label && item.actual === label).length;
  const falsePositive = samples.filter(item => item.expected !== label && item.actual === label).length;
  const falseNegative = samples.filter(item => item.expected === label && item.actual !== label).length;
  const precision = ratio(truePositive, truePositive + falsePositive);
  const recall = ratio(truePositive, truePositive + falseNegative);
  return sum + (precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall));
}, 0) / labels.length;

export const buildRegistrationCanaryGraderCalibrationReport = ({
  rootDir,
  calibrationPath = path.join(rootDir, REGISTRATION_CANARY_GRADER_CALIBRATION_PATH),
  gradeResult = gradeRegistrationCanaryResultBlind,
} = {}) => {
  const readResult = readRegistrationCanaryGraderCalibration({ rootDir, calibrationPath });
  const failures = [...readResult.failures];
  let context = null;
  if (failures.length === 0) {
    try {
      context = buildRegistrationCanaryCalibrationFixtureContext({ rootDir });
      const corpusCases = context.corpus.cases;
      const componentCase = corpusCases.find(item => item.id === readResult.calibration.componentCase.id);
      const targetCase = context.caseItem;
      const policy = context.policyEntry.descriptor;
      const componentRef = readResult.calibration.componentCase;
      const targetRef = readResult.calibration.target;
      if (!componentCase || componentCase.id !== componentRef.id
        || componentCase.coverageClass !== 'component-boundary'
        || componentCase.caseVersion !== componentRef.caseVersion
        || componentCase.subject?.version !== componentRef.subjectVersion
        || hashEvolutionTraceValue(componentCase) !== componentRef.caseSha256) failures.push('grader calibration component case 绑定已漂移');
      if (targetCase.id !== targetRef.caseRef.id
        || targetCase.caseVersion !== targetRef.caseRef.caseVersion
        || targetCase.subject?.version !== targetRef.caseRef.subjectVersion
        || hashEvolutionTraceValue(targetCase) !== targetRef.caseSha256) failures.push('grader calibration target case 绑定已漂移');
      if (policy.id !== targetRef.policyRef.id || policy.version !== targetRef.policyRef.version
        || hashEvolutionTraceValue(policy) !== targetRef.policySha256) failures.push('grader calibration trace policy 绑定已漂移');
    } catch {
      failures.push('grader calibration fixture context 不可构造');
    }
  }

  const sampleReports = [];
  let invocations = 0;
  if (failures.length === 0) {
    for (const sample of readResult.calibration.samples) {
      const input = buildRegistrationCanaryCalibrationInput(context, sample.mutation);
      const runs = Array.from({ length: readResult.calibration.thresholds.deterministicRuns }, () => {
        invocations += 1;
        return gradeCalibrationInput(gradeResult, input);
      });
      const actual = runs[0];
      const deterministic = runs.every(run => JSON.stringify(run) === JSON.stringify(actual));
      const labelAgreement = actual.label === sample.oracle.label;
      const reasonCodeAgreement = equalReasonCodes(actual.reasonCodes, sample.oracle.reasonCodes);
      sampleReports.push({
        id: sample.id,
        split: sample.split,
        difficulty: sample.difficulty,
        risk: sample.risk,
        mutation: sample.mutation,
        expectedLabel: sample.oracle.label,
        actualLabel: actual.label,
        expectedReasonCodes: [...sample.oracle.reasonCodes],
        actualReasonCodes: [...actual.reasonCodes],
        labelAgreement,
        reasonCodeAgreement,
        exactAgreement: labelAgreement && reasonCodeAgreement,
        deterministic,
      });
    }
  }

  const classRecall = Object.fromEntries(LABELS.map(label => {
    const classSamples = sampleReports.filter(item => item.expectedLabel === label);
    return [label, ratio(classSamples.filter(item => item.actualLabel === label).length, classSamples.length)];
  }));
  const control = sampleReports.find(item => item.mutation === 'control-pass');
  const mutants = sampleReports.filter(item => item.mutation !== 'control-pass');
  const metrics = {
    exactAgreement: ratio(sampleReports.filter(item => item.exactAgreement).length, sampleReports.length),
    labelAccuracy: ratio(sampleReports.filter(item => item.labelAgreement).length, sampleReports.length),
    macroF1: sampleReports.length === 0 ? 0 : calculateMacroF1(LABELS, sampleReports.map(item => ({ expected: item.expectedLabel, actual: item.actualLabel }))),
    classRecall,
    reasonCodeAgreement: ratio(sampleReports.filter(item => item.reasonCodeAgreement).length, sampleReports.length),
    determinism: ratio(sampleReports.filter(item => item.deterministic).length, sampleReports.length),
    mutationSensitivity: ratio(mutants.filter(item => item.exactAgreement && control
      && (item.actualLabel !== control.actualLabel || !equalReasonCodes(item.actualReasonCodes, control.actualReasonCodes))).length, mutants.length),
  };
  const thresholds = readResult.calibration?.thresholds ?? {
    exactAgreement: 1, macroF1: 1, classRecall: 1, reasonCodeAgreement: 1,
    determinism: 1, mutationSensitivity: 1, deterministicRuns: 3,
  };
  if (sampleReports.length > 0) {
    for (const field of ['exactAgreement', 'macroF1', 'reasonCodeAgreement', 'determinism', 'mutationSensitivity']) {
      if (metrics[field] < thresholds[field]) failures.push(`grader calibration metric ${field} 未达阈值`);
    }
    for (const label of LABELS) if (classRecall[label] < thresholds.classRecall) failures.push(`grader calibration recall ${label} 未达阈值`);
    for (const sample of sampleReports.filter(item => !item.exactAgreement || !item.deterministic)) {
      failures.push(`grader calibration sample ${sample.id} 未通过独立 oracle 或确定性检查`);
    }
  }
  return {
    schemaVersion: 1,
    reportType: 'ai-governance-grader-calibration',
    ok: failures.length === 0,
    evidenceScope: 'component-only',
    grader: readResult.calibration?.grader ?? null,
    rubricVersion: readResult.calibration?.rubric?.version ?? null,
    bindings: {
      calibrationSha256: readResult.calibrationSha256,
      fixtureFactorySha256: readResult.calibration?.fixture?.factorySha256 ?? null,
      componentCase: readResult.calibration?.componentCase ?? null,
      target: readResult.calibration?.target ?? null,
    },
    counts: {
      samples: sampleReports.length,
      graderInvocations: invocations,
      exactMatches: sampleReports.filter(item => item.exactAgreement).length,
      failures: failures.length,
    },
    thresholds,
    metrics,
    samples: sampleReports,
    failures,
    claims: {
      graderInvoked: invocations > 0,
      behaviorCoverageDelta: 0,
      automaticLedgerWrites: false,
      outcomeEligible: false,
      trusted: false,
    },
  };
};
