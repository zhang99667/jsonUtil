import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import {
  buildMcpRegistrationFeedbackCandidate,
  computeEvolutionFeedbackEventHash,
  readEvolutionFeedbackInbox,
} from './aiGovernanceEvolutionFeedbackInbox.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const corpus = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-13' });
const casesById = new Map(corpus.cases.map(item => [item.id, item]));
const caseItem = casesById.get('mcp-project-registration-discovery');

const withInbox = (events, run) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-feedback-'));
  const filePath = path.join(dir, 'feedback-inbox.jsonl');
  try {
    fs.writeFileSync(filePath, events.length ? `${events.map(JSON.stringify).join('\n')}\n` : '');
    return run(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const candidate = () => buildMcpRegistrationFeedbackCandidate({
  existingEvents: [], observedAt: '2026-07-11', caseItem, experimentId: 'mcp-project-registration-canary',
});

test('feedback inbox 接受闭字段、脱敏、hash-bound opened signal', () => withInbox([candidate()], (filePath) => {
  const report = readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-13' });
  assert.deepEqual(report.failures, []);
  assert.equal(report.chain.status, 'valid');
  assert.equal(report.chain.headSequence, 1);
  assert.equal(report.validEvents[0].claims.outcomeEligible, false);
  assert.equal(report.validEvents[0].evidence.scope, 'self-observed-unverified');
}));

test('feedback inbox 拒绝篡改、正文扩展和过度声明', () => {
  for (const mutate of [
    event => { event.previousHash = 'a'.repeat(64); },
    event => { event.evidence.detail = 'raw tool response'; },
    event => { event.claims.outcomeEligible = true; },
    event => { event.eventType = 'resolved'; event.disposition = 'resolved'; },
  ]) {
    const event = candidate();
    mutate(event);
    event.eventHash = computeEvolutionFeedbackEventHash(event);
    withInbox([event], filePath => assert.notDeepEqual(
      readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-13' }).failures,
      [],
    ));
  }
});

test('feedback candidate builder 不允许重复 signal', () => {
  const event = candidate();
  assert.throws(() => buildMcpRegistrationFeedbackCandidate({
    existingEvents: [event], observedAt: '2026-07-11', caseItem, experimentId: 'mcp-project-registration-canary',
  }), /已存在/);
});
