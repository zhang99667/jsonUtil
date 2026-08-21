import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import { prepareCiFixture } from './aiGovernanceCiContractTestFixtures.mjs';
import {
  AI_GOVERNANCE_CI_ENTRY_MAX_BYTES,
  readAiGovernanceCiEntrySource,
} from './aiGovernanceCiEntrySource.mjs';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';

const entryFile = '.github/workflows/ci.yml';
const invalidEntryFailure = `${entryFile}: AI 治理自动化入口必须是稳定可读的非 symlink 单链接普通文件`;

test('AI 治理 CI 入口为目录时返回固定无值诊断而不抛异常', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareCiFixture(rootDir);
    const workflow = path.join(rootDir, entryFile);
    fs.unlinkSync(workflow);
    fs.mkdirSync(workflow);

    assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), [
      invalidEntryFailure,
    ]);
  });
});

test('AI 治理 CI 入口接受 1 MiB 上限并拒绝 cap+1', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const workflow = path.join(rootDir, entryFile);
    fs.mkdirSync(path.dirname(workflow), { recursive: true });
    fs.writeFileSync(workflow, Buffer.alloc(AI_GOVERNANCE_CI_ENTRY_MAX_BYTES, 0x78));
    const accepted = readAiGovernanceCiEntrySource(rootDir, entryFile);
    assert.equal(accepted.content.length, AI_GOVERNANCE_CI_ENTRY_MAX_BYTES);
    assert.deepEqual(accepted.failures, []);

    fs.appendFileSync(workflow, 'x');
    assert.deepEqual(readAiGovernanceCiEntrySource(rootDir, entryFile).failures, [
      `${entryFile}: AI 治理自动化入口不能超过 ${AI_GOVERNANCE_CI_ENTRY_MAX_BYTES} bytes`,
    ]);
  });
});

test('AI 治理 CI 入口拒绝非法 UTF-8', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const workflow = path.join(rootDir, entryFile);
    fs.mkdirSync(path.dirname(workflow), { recursive: true });
    fs.writeFileSync(workflow, Buffer.from([0xff]));
    assert.deepEqual(readAiGovernanceCiEntrySource(rootDir, entryFile).failures, [
      `${entryFile}: AI 治理自动化入口必须是严格 UTF-8`,
    ]);
  });
});

test('AI 治理 CI 入口拒绝 symlink 和 hardlink', { skip: process.platform === 'win32' }, () => {
  for (const kind of ['symlink', 'hardlink']) withAiGovernanceTempRoot((rootDir) => {
    const target = path.join(rootDir, 'target.yml');
    const workflow = path.join(rootDir, entryFile);
    fs.mkdirSync(path.dirname(workflow), { recursive: true });
    fs.writeFileSync(target, 'steps:\n');
    if (kind === 'symlink') fs.symlinkSync(target, workflow);
    else fs.linkSync(target, workflow);
    assert.deepEqual(readAiGovernanceCiEntrySource(rootDir, entryFile).failures, [invalidEntryFailure]);
  });
});
