import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import {
  buildBehaviorEvidenceFeedbackCandidate,
  buildMaintainerCorrectionFeedbackCandidate,
  buildMcpRegistrationFeedbackCandidate,
  computeEvolutionFeedbackEventHash,
  readEvolutionFeedbackInbox,
} from './aiGovernanceEvolutionFeedbackInbox.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const corpus = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-15' });
const casesById = new Map(corpus.cases.map(item => [item.id, item]));
const caseItem = casesById.get('mcp-project-registration-discovery');
const skillCaseItem = casesById.get('skill-jsonutils-ai-infra-evolver-trigger');
const ownershipCaseItem = casesById.get('rule-project-ai-asset-ownership');
const caseRefFailure = 'feedback-inbox.jsonl: 第 2 行.caseRef 必须绑定当前版本或 event hash 登记的精确历史版本';

const withInbox = (events, run) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-feedback-compatibility-'));
  const filePath = path.join(dir, 'feedback-inbox.jsonl');
  try {
    fs.writeFileSync(filePath, `${events.map(JSON.stringify).join('\n')}\n`);
    return run(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
const firstEvent = () => buildMcpRegistrationFeedbackCandidate({
  existingEvents: [], observedAt: '2026-07-11', caseItem, experimentId: 'mcp-project-registration-canary',
});
const skillEvent = (first, observedAt = '2026-07-13') => buildBehaviorEvidenceFeedbackCandidate({
  existingEvents: [first], observedAt, caseItem: skillCaseItem,
  experimentId: 'skill-evolver-fresh-context-paired',
});
const readFailures = events => withInbox(events, filePath => (
  readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures
));

test('feedback inbox 只接受 event id/hash 登记的精确历史 caseRef', () => {
  for (const [caseVersion, subjectVersion, accepted] of [
    [4, '0.1.29', true], [4, '0.1.31', false], [4, '0.1.30', false],
    [5, '0.1', false], [5, '0-1-29', false], [5, '0.1.029', false], [5, '0.1.29.1', false],
    [5, '0.1.31.0', false], [3, '0.1.29', false], [6, '0.1.31', false], [5, '0.1.32', false],
  ]) {
    const first = firstEvent();
    const event = skillEvent(first);
    event.caseRef = { ...event.caseRef, caseVersion, subjectVersion };
    event.eventHash = computeEvolutionFeedbackEventHash(event);
    assert.deepEqual(readFailures([first, event]), accepted ? [] : [caseRefFailure], `${caseVersion}/${subjectVersion}`);
  }
});

test('feedback inbox 历史 event id 不得通过当前 tuple 快路', () => {
  const first = firstEvent();
  assert.deepEqual(readFailures([first, skillEvent(first)]), [caseRefFailure]);
});

test('feedback inbox 新 event id 仍接受当前 tuple', () => {
  const first = firstEvent();
  assert.deepEqual(readFailures([first, skillEvent(first, '2026-07-15')]), []);
});

test('feedback inbox 历史 caseRef 同时绑定登记 event id 与 event hash', () => {
  for (const mutate of [
    event => { event.id = `${event.id}-other`; },
    event => { event.experimentId = 'other-experiment'; },
  ]) {
    const first = firstEvent();
    const event = skillEvent(first);
    event.caseRef = { ...event.caseRef, caseVersion: 4, subjectVersion: '0.1.29' };
    mutate(event);
    event.eventHash = computeEvolutionFeedbackEventHash(event);
    assert.deepEqual(readFailures([first, event]), [caseRefFailure]);
  }
});

test('feedback inbox 拒绝跨 schema 复用 evidence profile', () => {
  const first = firstEvent();
  first.schemaVersion = 2;
  first.eventHash = computeEvolutionFeedbackEventHash(first);
  const second = buildBehaviorEvidenceFeedbackCandidate({ existingEvents: [], observedAt: '2026-07-15',
    caseItem: skillCaseItem, experimentId: 'skill-evolver-fresh-context-paired' });
  second.schemaVersion = 1;
  second.eventHash = computeEvolutionFeedbackEventHash(second);
  const third = buildMaintainerCorrectionFeedbackCandidate({ existingEvents: [], observedAt: '2026-07-15',
    caseItem: ownershipCaseItem });
  third.schemaVersion = 2;
  third.experimentId = 'skill-evolver-fresh-context-paired';
  third.eventHash = computeEvolutionFeedbackEventHash(third);
  for (const event of [first, second, third]) assert.deepEqual(readFailures([event]), [
    'feedback-inbox.jsonl: 第 1 行.evidence 必须使用版本允许的固定脱敏观察码',
  ]);
});
