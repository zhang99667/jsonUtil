import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectAiGovernanceAiSafetyEvidenceFailures,
} from './aiGovernanceAiSafetyEvidence.mjs';
import {
  snippetsForSafetyEvidenceFile,
  writeSafetyEvidenceFixture,
} from './aiGovernanceAiSafetyEvidenceTestFixtures.mjs';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';

const assertEvidenceIncludes = (file, snippet) => {
  assert.ok(snippetsForSafetyEvidenceFile(file).includes(snippet));
};

test('AI 治理安全证据契约清单锁定关键安全边界', () => {
  assertEvidenceIncludes('frontend/src/utils/aiRepairRequestPolicy.test.ts', '断言函数会阻止敏感原文进入外部模型');
  assertEvidenceIncludes('frontend/src/services/aiService.test.ts', '本地可修复敏感字段时不发送 AI 请求');
  assertEvidenceIncludes('frontend/src/services/aiService.test.ts', '本地不可修复时可识别内部 Base64 片段中的敏感字段并阻止发送');
  assertEvidenceIncludes('frontend/src/services/aiRepairProviderClient.test.ts', 'Gemini SDK 鉴权状态错误会归一为 ProviderAuth');
});

test('AI 治理安全证据契约接受完整测试证据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSafetyEvidenceFixture(rootDir);

    assert.deepEqual(collectAiGovernanceAiSafetyEvidenceFailures(rootDir), []);
  });
});
