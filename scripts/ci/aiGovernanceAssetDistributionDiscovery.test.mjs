import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES,
  discoverAiGovernanceImplementationFiles,
} from './aiGovernanceImplementationFiles.mjs';

test('AI 实现 namespace 与 eval data 对 symlink fail closed', {
  skip: process.platform === 'win32',
}, () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-distribution-files-'));
  try {
    assert.deepEqual(discoverAiGovernanceImplementationFiles(tempRoot), [...AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES].sort());
    ['scripts/ci', 'scripts/mcp', 'evals/ai-governance'].forEach(directory => (
      fs.mkdirSync(path.join(tempRoot, directory), { recursive: true })
    ));
    fs.writeFileSync(path.join(tempRoot, 'target.mjs'), 'export {};\n');
    fs.symlinkSync('../../target.mjs', path.join(tempRoot, 'scripts/ci/aiGovernanceLinked.mjs'));
    assert.throws(() => discoverAiGovernanceImplementationFiles(tempRoot), /必须是普通文件/);

    fs.unlinkSync(path.join(tempRoot, 'scripts/ci/aiGovernanceLinked.mjs'));
    fs.symlinkSync('../../target.mjs', path.join(tempRoot, 'evals/ai-governance/linked.json'));
    assert.throws(() => discoverAiGovernanceImplementationFiles(tempRoot), /AI data asset/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
