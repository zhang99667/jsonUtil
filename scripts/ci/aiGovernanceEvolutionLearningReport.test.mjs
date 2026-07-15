import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionFeedbackInbox } from './aiGovernanceEvolutionFeedbackInbox.mjs';
import { buildEvolutionLearningReport } from './aiGovernanceEvolutionLearningReport.mjs';
import { buildFeedbackCandidateFromProfile } from './prepare-ai-evolution-feedback.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');

test('learning report 接收无 experiment 的 maintainer correction triage 但不增加实验', (t) => {
  const cases = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-15' }).cases;
  const current = readEvolutionFeedbackInbox(path.join(rootDir, 'evals/ai-governance/feedback-inbox.jsonl'), {
    casesById: new Map(cases.map(item => [item.id, item])), maxDate: '2026-07-15',
  }).validEvents;
  const candidate = buildFeedbackCandidateFromProfile({ existingEvents: current, observedAt: '2026-07-15', cases,
    profile: 'maintainer-correction', caseId: 'rule-project-ai-asset-ownership' });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-learning-correction-'));
  const candidatePath = path.join(directory, 'feedback-inbox.jsonl');
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(candidatePath, `${current.map(JSON.stringify).join('\n')}\n${JSON.stringify(candidate)}\n`);
  const report = buildEvolutionLearningReport({ rootDir, feedbackPath: candidatePath, maxDate: '2026-07-15',
    tracePolicyCaseIds: ['skill-jsonutils-ai-infra-evolver-trigger'] });
  assert.equal(report.ok, true);
  assert.deepEqual([report.counts.feedbackSignals, report.counts.experiments, report.counts.plannedTrials], [3, 2, 12]);
  assert.equal(report.openSignalIds.includes(candidate.signalId), true);
});
