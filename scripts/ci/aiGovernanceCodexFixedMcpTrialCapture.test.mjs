import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildFixedMcpCapture } from './aiGovernanceCodexFixedMcpCaptureTestFixtures.mjs';
import { parseCodexFixedMcpCaptureArtifact } from './aiGovernanceCodexFixedMcpTrialCapture.mjs';

const profile = Object.freeze({
  id: 'codex-fixed-mcp-trial', version: '1.3.1', caseId: 'mcp-fixed-tool-selection',
  modelId: 'gpt-5.4', binarySha256: 'a'.repeat(64), componentDescriptorSha256: 'b'.repeat(64),
});
const parse = artifact => parseCodexFixedMcpCaptureArtifact({
  captureJson: JSON.stringify(artifact), profile,
});

test('固定 capture artifact 只接受闭字段和精确 component descriptor 绑定', () => {
  const artifact = buildFixedMcpCapture(profile);
  assert.deepEqual(parse(artifact), artifact);
  artifact.executionFacts.componentDescriptorSha256 = 'c'.repeat(64);
  assert.throws(() => parse(artifact), /profile 绑定不匹配/);
  artifact.executionFacts.componentDescriptorSha256 = profile.componentDescriptorSha256;
  artifact.secret = 'MUST_NOT_SURVIVE';
  assert.throws(() => parse(artifact), /闭字段对象/);
});

test('固定 capture artifact 不允许在版本或 completeness reason 中携带正文', () => {
  const artifact = buildFixedMcpCapture(profile);
  artifact.executionFacts.cliVersion = 'SECRET_CLI_BODY';
  assert.throws(() => parse(artifact), /基础字段非法/);
  artifact.executionFacts.cliVersion = '0.144.0-alpha.4';
  artifact.completeness = { status: 'partial', reasons: ['SECRET reason body'] };
  assert.throws(() => parse(artifact), /基础字段非法/);
});
