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
const corpus = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-15' });
const casesById = new Map(corpus.cases.map(item => [item.id, item]));
const caseItem = casesById.get('mcp-project-registration-discovery');

const withInboxText = (text, run) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-feedback-'));
  const filePath = path.join(dir, 'feedback-inbox.jsonl');
  try {
    fs.writeFileSync(filePath, text);
    return run(filePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
const withInbox = (events, run) => withInboxText(
  events.length ? `${events.map(JSON.stringify).join('\n')}\n` : '',
  run,
);

const candidate = () => buildMcpRegistrationFeedbackCandidate({
  existingEvents: [], observedAt: '2026-07-11', caseItem, experimentId: 'mcp-project-registration-canary',
});

test('feedback inbox 接受闭字段、脱敏、hash-bound opened signal', () => withInbox([candidate()], (filePath) => {
  const report = readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' });
  assert.deepEqual(report.failures, []);
  assert.equal(report.chain.status, 'valid');
  assert.equal(report.chain.headSequence, 1);
  assert.equal(report.validEvents[0].claims.outcomeEligible, false);
  assert.equal(report.validEvents[0].evidence.scope, 'self-observed-unverified');
}));

test('feedback inbox 拒绝篡改、正文扩展和过度声明', () => {
  for (const [mutate, expectedFailures] of [
    [event => { event.previousHash = 'a'.repeat(64); }, ['feedback-inbox.jsonl: 第 1 行.previousHash 必须绑定直接前一事件']],
    [event => { event.evidence.detail = 'raw tool response'; }, ['feedback-inbox.jsonl: 第 1 行.evidence: 不允许字段 `detail`']],
    [event => { event.claims.outcomeEligible = true; }, ['feedback-inbox.jsonl: 第 1 行.claims.outcomeEligible 必须为 false']],
    [event => { event.privacy.promptStored = true; }, ['feedback-inbox.jsonl: 第 1 行.privacy.promptStored 必须为 false']],
    [event => { event.eventType = 'resolved'; event.disposition = 'resolved'; }, [
      'feedback-inbox.jsonl: 第 1 行.eventType 枚举值非法',
      'feedback-inbox.jsonl: 第 1 行 当前 schema 只接受 open disposition；关闭需后续显式 schema',
    ]],
  ]) {
    const event = candidate();
    mutate(event);
    event.eventHash = computeEvolutionFeedbackEventHash(event);
    withInbox([event], filePath => assert.deepEqual(
      readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures,
      expectedFailures,
    ));
  }
});

test('feedback inbox 对 eventHash、紧凑 JSON 与 JSON 解析 fail closed', () => {
  const event = candidate();
  event.eventHash = 'a'.repeat(64);
  withInbox([event], filePath => assert.deepEqual(
    readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures,
    ['feedback-inbox.jsonl: 第 1 行.eventHash 与精确紧凑事件不一致'],
  ));
  const valid = JSON.stringify(candidate());
  withInboxText(`${valid.replace('{', '{ ')}\n`, filePath => assert.deepEqual(
    readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures,
    ['feedback-inbox.jsonl: 第 1 行必须是精确紧凑 JSON'],
  ));
  withInboxText('{\n', filePath => assert.match(
    readEvolutionFeedbackInbox(filePath, { casesById, maxDate: '2026-07-15' }).failures.join('\n'),
    /第 1 行无法解析 JSON/u,
  ));
});
