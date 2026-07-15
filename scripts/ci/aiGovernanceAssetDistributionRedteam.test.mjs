import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import { collectUntrackedAiGovernanceAssetFailures } from './aiGovernanceAssetDistribution.mjs';
import {
  decodeHermeticGitNulRecords,
  isSafeHermeticGitPath,
} from './aiGovernanceHermeticGitInventory.mjs';

const runGit = (rootDir, args, input = null) => {
  const result = spawnSync('git', ['-C', rootDir, ...args], {
    encoding: 'utf8',
    input,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'JSONUtils Test',
      GIT_AUTHOR_EMAIL: 'jsonutils-test@example.invalid',
      GIT_COMMITTER_NAME: 'JSONUtils Test',
      GIT_COMMITTER_EMAIL: 'jsonutils-test@example.invalid',
    },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

const withRepository = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-distribution-'));
  try {
    runGit(rootDir, ['init', '-q']);
    fs.writeFileSync(path.join(rootDir, 'asset.md'), 'old\n');
    runGit(rootDir, ['add', 'asset.md']);
    runGit(rootDir, ['commit', '-qm', 'fixture']);
    run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('index 与 HEAD 直接比较工作树原始字节，不受 assume-unchanged 隐藏影响', () => {
  withRepository((rootDir) => {
    runGit(rootDir, ['update-index', '--assume-unchanged', 'asset.md']);
    fs.writeFileSync(path.join(rootDir, 'asset.md'), 'changed\n');

    for (const scope of ['index', 'head']) {
      const failures = collectUntrackedAiGovernanceAssetFailures(rootDir, ['asset.md'], scope);
      assert.equal(failures.length, 1, `${scope} 必须拒绝被 assume-unchanged 隐藏的内容漂移`);
    }
  });
});

test('index 与 HEAD 拒绝 symlink 资产，即使 Git 路径清单和内容看似存在', {
  skip: process.platform === 'win32',
}, () => {
  withRepository((rootDir) => {
    fs.writeFileSync(path.join(rootDir, 'target.md'), 'target\n');
    fs.unlinkSync(path.join(rootDir, 'asset.md'));
    fs.symlinkSync('target.md', path.join(rootDir, 'asset.md'));
    runGit(rootDir, ['add', 'asset.md', 'target.md']);
    runGit(rootDir, ['commit', '-qm', 'symlink']);

    for (const scope of ['workspace', 'index', 'head']) {
      const failures = collectUntrackedAiGovernanceAssetFailures(rootDir, ['asset.md'], scope);
      assert.equal(failures.length, 1, `${scope} 必须拒绝 symlink`);
    }
  });
});

test('index 与 HEAD 直接比较 executable mode，不受 core.filemode=false 隐藏影响', {
  skip: process.platform === 'win32',
}, () => {
  withRepository((rootDir) => {
    runGit(rootDir, ['config', 'core.filemode', 'false']);
    fs.chmodSync(path.join(rootDir, 'asset.md'), 0o755);

    for (const scope of ['index', 'head']) {
      const failures = collectUntrackedAiGovernanceAssetFailures(rootDir, ['asset.md'], scope);
      assert.equal(failures.length, 1, `${scope} 必须拒绝 executable mode 漂移`);
    }
  });
});

test('index 与 HEAD 比较原始字节，不能被 .gitattributes clean filter 隐藏', () => {
  withRepository((rootDir) => {
    fs.writeFileSync(path.join(rootDir, 'filter.mjs'), "process.stdin.resume(); process.stdin.on('end', () => process.stdout.write('canonical\\n'));\n");
    fs.writeFileSync(path.join(rootDir, '.gitattributes'), 'asset.md filter=canonical\n');
    runGit(rootDir, ['config', 'filter.canonical.clean', `"${process.execPath}" filter.mjs`]);
    fs.writeFileSync(path.join(rootDir, 'asset.md'), 'raw-source\n');
    runGit(rootDir, ['add', '.gitattributes', 'filter.mjs', 'asset.md']);
    runGit(rootDir, ['commit', '-qm', 'filtered']);

    for (const scope of ['index', 'head']) {
      const failures = collectUntrackedAiGovernanceAssetFailures(rootDir, ['asset.md'], scope);
      assert.equal(failures.length, 1, `${scope} 必须拒绝 clean filter 隐藏的原始字节差异`);
    }
  });
});

test('HEAD 读取禁用 replace refs，不能用替换提交冒充 clone-visible 内容', () => {
  withRepository((rootDir) => {
    const actualHead = runGit(rootDir, ['rev-parse', 'HEAD']);
    fs.writeFileSync(path.join(rootDir, 'asset.md'), 'replacement\n');
    runGit(rootDir, ['add', 'asset.md']);
    const replacementTree = runGit(rootDir, ['write-tree']);
    const replacementCommit = runGit(rootDir, ['commit-tree', replacementTree, '-p', actualHead], 'replacement\n');
    runGit(rootDir, ['update-ref', `refs/replace/${actualHead}`, replacementCommit]);

    const failures = collectUntrackedAiGovernanceAssetFailures(rootDir, ['asset.md'], 'head');
    assert.equal(failures.length, 1, 'HEAD 必须读取真实提交而不是本机 replacement commit');
  });
});

test('HEAD inventory 显式禁用 quotePath 并接受 NFC Unicode 路径', () => {
  withRepository((rootDir) => {
    const unicodeAsset = '中文-资产.md';
    runGit(rootDir, ['config', 'core.quotePath', 'true']);
    fs.writeFileSync(path.join(rootDir, unicodeAsset), 'unicode\n');
    runGit(rootDir, ['add', unicodeAsset]);
    runGit(rootDir, ['commit', '-qm', 'unicode asset']);

    assert.deepEqual(collectUntrackedAiGovernanceAssetFailures(
      rootDir, [unicodeAsset], 'head',
    ), []);
  });
});

test('Unicode inventory 仍严格拒绝非 UTF-8、缺失 NUL 终止和不安全路径', () => {
  assert.throws(() => decodeHermeticGitNulRecords(Buffer.from([0xff, 0x00])));
  assert.throws(() => decodeHermeticGitNulRecords(Buffer.from('未终止')));
  assert.equal(isSafeHermeticGitPath('../中文.md'), false);
  assert.equal(isSafeHermeticGitPath('中文\0.md'), false);
  assert.equal(isSafeHermeticGitPath('e\u0301.md'), false);
});
