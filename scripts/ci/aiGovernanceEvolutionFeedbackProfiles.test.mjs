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

const withInbox = (events, run) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-feedback-profiles-'));
  const filePath = path.join(dir, 'feedback-inbox.jsonl');
  try {
    fs.writeFileSync(filePath, `${events.map(JSON.stringify).join('\n')}\n`);
    return run(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
const candidate = () => buildMcpRegistrationFeedbackCandidate({
  existingEvents: [], observedAt: '2026-07-11', caseItem, experimentId: 'mcp-project-registration-canary',
});

test('feedback candidate builder 不允许重复 signal', () => {
  const event = candidate();
  assert.throws(() => buildMcpRegistrationFeedbackCandidate({
    existingEvents: [event], observedAt: '2026-07-11', caseItem, experimentId: 'mcp-project-registration-canary',
  }), /feedback signal `mcp-project-registration-unavailable-20260711` 已存在/u);
  const duplicate = { ...event, id: `${event.id}-duplicate`, sequence: 2, previousHash: event.eventHash };
  duplicate.eventHash = computeEvolutionFeedbackEventHash(duplicate);
  withInbox([event, duplicate], filePath => assert.deepEqual(
    readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures,
    ['feedback-inbox.jsonl: signalId 必须唯一'],
  ));
});

test('feedback inbox v2 接受 skill behavior channel 缺口且保持 hash chain', () => {
  const first = candidate();
  const second = buildBehaviorEvidenceFeedbackCandidate({ existingEvents: [first], observedAt: '2026-07-15',
    caseItem: skillCaseItem, experimentId: 'skill-evolver-fresh-context-paired' });
  withInbox([first, second], (filePath) => {
    const report = readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' });
    assert.deepEqual(report.failures, []);
    assert.equal(report.chain.headSequence, 2);
    assert.equal(report.validEvents[1].evidence.code, 'behavior-evidence-channel-missing');
  });
  second.sequence = 3;
  second.previousHash = 'a'.repeat(64);
  second.eventHash = computeEvolutionFeedbackEventHash(second);
  withInbox([first, second], filePath => assert.deepEqual(
    readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures,
    [
      'feedback-inbox.jsonl: 第 2 行.sequence 必须等于物理非空行序',
      'feedback-inbox.jsonl: 第 2 行.previousHash 必须绑定直接前一事件',
    ],
  ));
});

test('feedback inbox v3 接受 case-bound maintainer correction 且不伪造 experiment', () => {
  const first = candidate();
  const second = buildBehaviorEvidenceFeedbackCandidate({ existingEvents: [first], observedAt: '2026-07-15',
    caseItem: skillCaseItem, experimentId: 'skill-evolver-fresh-context-paired' });
  const third = buildMaintainerCorrectionFeedbackCandidate({ existingEvents: [first, second],
    observedAt: '2026-07-15', caseItem: ownershipCaseItem });
  withInbox([first, second, third], (filePath) => {
    const report = readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' });
    assert.deepEqual(report.failures, []);
    assert.equal(report.chain.headSequence, 3);
    assert.equal(report.validEvents[2].experimentId, null);
    assert.equal(report.validEvents[2].evidence.scope, 'case-bound-redacted');
  });

  third.experimentId = 'invented-experiment';
  third.eventHash = computeEvolutionFeedbackEventHash(third);
  withInbox([first, second, third], filePath => assert.deepEqual(
    readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures,
    ['feedback-inbox.jsonl: 第 3 行.experimentId 必须为 null'],
  ));
});
