import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AI_SAFETY_EVIDENCE_FILES,
  collectAiGovernanceAiSafetyEvidenceFailures,
} from './aiGovernanceAiSafetyEvidence.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const writeSafetyEvidenceFixture = (rootDir, overrides = {}) => {
  AI_SAFETY_EVIDENCE_FILES.forEach(({ file, snippets }) => {
    if (overrides[file] === null) return;
    writeFixtureFile(rootDir, file, Object.hasOwn(overrides, file) ? overrides[file] : snippets.join('\n'));
  });
};
const snippetsFor = file => AI_SAFETY_EVIDENCE_FILES.find(entry => entry.file === file)?.snippets ?? [];
const assertEvidenceIncludes = (file, snippet) => {
  assert.ok(snippetsFor(file).includes(snippet));
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

test('AI 治理安全证据契约会报告缺少外部模型边界测试', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSafetyEvidenceFixture(rootDir, {
      'frontend/src/services/aiService.test.ts': [
        '本地可修复时不会调用 AI 接口',
        '命中敏感字段时默认阻止发送原文',
      ].join('\n'),
    });

    assert.deepEqual(collectAiGovernanceAiSafetyEvidenceFailures(rootDir), [
      'frontend/src/services/aiService.test.ts: AI 安全证据缺少 "本地可修复敏感字段时不发送 AI 请求"',
      'frontend/src/services/aiService.test.ts: AI 安全证据缺少 "本地不可修复的大输入会阻止发送原文"',
      'frontend/src/services/aiService.test.ts: AI 安全证据缺少 "本地不可修复时可识别内部 Base64 片段中的敏感字段并阻止发送"',
    ]);
  });
});

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

test('AI 治理安全证据契约会报告缺失测试文件', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeSafetyEvidenceFixture(rootDir, {
      'frontend/src/utils/aiRepairRequestPolicy.test.ts': null,
    });

    assert.deepEqual(collectAiGovernanceAiSafetyEvidenceFailures(rootDir), [
      'frontend/src/utils/aiRepairRequestPolicy.test.ts: AI 安全证据测试文件不存在',
    ]);
  });
});
