#!/usr/bin/env node
// 校验 AI 行为 eval 语料与真实 outcome ledger 的确定性契约。

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAiGovernanceEvolutionSuiteReport } from './aiGovernanceEvolutionSuiteReport.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const report = buildAiGovernanceEvolutionSuiteReport({ rootDir });

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const { counts, nextFocus } = report;
  const behaviorCases = counts.behaviorCases ?? counts.cases;
  const excludedBoundaries = counts.componentBoundaryCases ?? 0;
  if (report.ok) {
    console.log(`AI 治理进化 eval 校验通过：${counts.cases} cases，${counts.outcomes} outcomes，behavior outcome 覆盖 ${counts.coveredCases}/${behaviorCases}；${excludedBoundaries} 个 component-boundary cases 已排除。`);
  } else {
    console.error(`AI 治理进化 eval 校验失败：${counts.failures} 个执行/契约失败，${counts.evidenceFreshnessFailures} 个证据时效问题。`);
    report.failures.forEach(failure => console.error(`- ${failure}`));
    report.evidenceFreshness.failures.forEach(failure => console.error(`- ${failure}`));
  }
  console.log(`账本追加性：${report.ledgerIntegrity.status}（Git 基线 ${report.ledgerIntegrity.baseRef}）`);
  console.log(`账本链：${report.ledgerChain.status}（v3 ${report.ledgerChain.chainedOutcomes} 条，head ${report.ledgerChain.headSequence ?? 'none'}）`);
  console.log(`Trace：bound ${counts.traceBoundOutcomes}，verified ${counts.traceVerifiedOutcomes}，unverified ${counts.traceBoundUnverifiedOutcomes}`);
  console.log(`Grader calibration：${report.graderHealth.ok ? 'pass' : 'fail'}（${counts.graderCalibrationSamples} samples，${counts.graderCalibrationFailures} failures）`);
  console.log(`Learning：open signals ${counts.openFeedbackSignals}，experiments ${counts.experiments}，planned trials ${counts.plannedExperimentTrials}`);
  console.log(`下一焦点：${nextFocus.id} - ${nextFocus.nextAction}`);
  if (nextFocus.caseIds.length > 0) console.log(`建议 cases：${nextFocus.caseIds.join(', ')}`);
  if (report.blockedFocus) console.log(`外部阻塞焦点：${report.blockedFocus.id} [${report.blockedFocus.blockingScope}]`);
}

if (!report.ok) process.exitCode = 1;
