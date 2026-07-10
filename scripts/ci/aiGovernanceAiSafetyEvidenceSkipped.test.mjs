import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectAiGovernanceAiSafetyEvidenceFailures,
} from './aiGovernanceAiSafetyEvidence.mjs';
import { writeSafetyEvidenceFixture } from './aiGovernanceAiSafetyEvidenceTestFixtures.mjs';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';

test('AI 治理安全证据契约会报告被跳过的关键测试', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSafetyEvidenceFixture(rootDir, {
      'frontend/src/services/aiService.test.ts': [
        '本地可修复时不会调用 AI 接口',
        "it.skip('本地可修复敏感字段时不发送 AI 请求', () => {})",
        "test.todo('本地不可修复的大输入会阻止发送原文')",
        '命中敏感字段时默认阻止发送原文',
        '本地不可修复时可识别内部 Base64 片段中的敏感字段并阻止发送',
      ].join('\n'),
    });

    assert.deepEqual(collectAiGovernanceAiSafetyEvidenceFailures(rootDir), [
      'frontend/src/services/aiService.test.ts: AI 安全证据测试被跳过 "本地可修复敏感字段时不发送 AI 请求"',
      'frontend/src/services/aiService.test.ts: AI 安全证据测试被跳过 "本地不可修复的大输入会阻止发送原文"',
    ]);
  });
});
