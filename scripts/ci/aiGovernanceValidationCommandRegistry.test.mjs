import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  JSONUTILS_VALIDATION_COMMAND_IDENTITIES,
  buildJsonutilsValidationCommandRegistry,
  hashJsonutilsValidationCommandDescriptor,
  resolveJsonutilsValidationCommandDisplays,
  resolveJsonutilsValidationCommandIds,
} from './aiGovernanceValidationCommandRegistry.mjs';
import {
  matchJsonutilsValidationRules,
  uniqueValidationCommands,
} from '../mcp/jsonutils-governance-validation-rules.mjs';

const MCP_TEST_DISPLAY = 'node --test --test-reporter=dot scripts/mcp/*.test.mjs';

const runGit = (rootDir, args) => {
  const result = spawnSync('git', ['-C', rootDir, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'JSONUtils Test',
      GIT_AUTHOR_EMAIL: 'jsonutils-test@example.invalid',
      GIT_COMMITTER_NAME: 'JSONUtils Test',
      GIT_COMMITTER_EMAIL: 'jsonutils-test@example.invalid',
    },
  });
  assert.equal(result.status, 0, result.stderr);
};

const createRoot = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-validation-registry-'));
  fs.mkdirSync(path.join(rootDir, 'scripts/ci'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'scripts/mcp'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'scripts/ci/base.test.mjs'), '');
  fs.writeFileSync(path.join(rootDir, 'scripts/mcp/base.test.mjs'), '');
  runGit(rootDir, ['init', '-q']);
  runGit(rootDir, ['add', 'scripts/ci/base.test.mjs', 'scripts/mcp/base.test.mjs']);
  runGit(rootDir, ['commit', '-qm', 'fixture']);
  return rootDir;
};

const removeRoot = rootDir => fs.rmSync(rootDir, { recursive: true, force: true });
const hasCode = code => error => error?.code === code;

test('固定注册表与 validation rules 的 13 条只读 display command 一一对应', () => {
  const rootDir = createRoot();
  try {
    const ruleFiles = [
      { path: 'AGENTS.md' },
      { path: 'evals/ai-governance/cases.json' },
      { path: 'scripts/mcp/server.mjs' },
      { path: 'scripts/ci/helper.mjs' },
      { path: 'frontend/package.json' },
      { path: '.github/workflows/ci.yml' },
      { path: 'docker-compose.yml' },
    ];
    const displays = uniqueValidationCommands(matchJsonutilsValidationRules(ruleFiles)).map(item => item.command);
    const registry = buildJsonutilsValidationCommandRegistry({ rootDir });
    assert.equal(displays.length, 13);
    assert.equal(registry.length, 13);
    assert.deepEqual(new Set(registry.map(item => item.displayCommand)), new Set(displays));
    assert.equal(new Set(registry.map(item => item.id)).size, 13);
    assert.deepEqual(registry.map(({ id, displayCommand }) => ({ id, displayCommand })), JSONUTILS_VALIDATION_COMMAND_IDENTITIES);
    registry.forEach((item) => {
      assert.deepEqual(Object.keys(item.descriptor).sort(), ['argv', 'envProfile', 'executable', 'timeout']);
      assert.match(item.descriptorSha256, /^[a-f0-9]{64}$/);
      assert.equal(item.descriptorSha256, hashJsonutilsValidationCommandDescriptor(item.descriptor));
    });
    const firstDescriptor = registry[0].descriptor;
    assert.equal(hashJsonutilsValidationCommandDescriptor(firstDescriptor), hashJsonutilsValidationCommandDescriptor({
      timeout: firstDescriptor.timeout,
      executable: firstDescriptor.executable,
      envProfile: firstDescriptor.envProfile,
      argv: [...firstDescriptor.argv],
    }));
    assert.throws(
      () => hashJsonutilsValidationCommandDescriptor({ ...registry[0].descriptor, shell: true }),
      hasCode('VALIDATION_COMMAND_DESCRIPTOR_FIELDS_INVALID'),
    );

    const productionCompose = registry.find(item => item.id === 'compose-production-config');
    assert.equal(productionCompose.descriptor.executable, 'docker');
    assert.deepEqual(productionCompose.descriptor.argv, ['compose', '-f', 'docker-compose.yml', 'config']);
    assert.equal(productionCompose.descriptor.envProfile, 'jsonutils-validation-compose-config-v1');
    assert.equal(productionCompose.descriptor.argv.includes('env'), false);

    const whitespaceCheck = registry.find(item => item.id === 'check-validation-whitespace');
    assert.equal(whitespaceCheck.descriptor.executable, 'node');
    assert.deepEqual(whitespaceCheck.descriptor.argv, ['scripts/ci/check-ai-validation-whitespace.mjs']);
    assert.equal(registry.some(item => item.id === 'write-governance-artifacts'), false);
  } finally { removeRoot(rootDir); }
});

test('test glob 只稳定展开受限目录中的直接普通文件', () => {
  const rootDir = createRoot();
  try {
    fs.writeFileSync(path.join(rootDir, 'scripts/mcp/zeta.test.mjs'), '');
    fs.writeFileSync(path.join(rootDir, 'scripts/mcp/alpha.test.mjs'), '');
    fs.writeFileSync(path.join(rootDir, 'scripts/mcp/ignored.mjs'), '');
    fs.mkdirSync(path.join(rootDir, 'scripts/mcp/nested'));
    fs.writeFileSync(path.join(rootDir, 'scripts/mcp/nested/hidden.test.mjs'), '');
    const resolve = () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [MCP_TEST_DISPLAY] })[0];
    const first = resolve(), second = resolve();
    assert.deepEqual(first, second);
    assert.deepEqual(first.descriptor.argv, [
      '--test', '--test-reporter=dot',
      'scripts/mcp/alpha.test.mjs',
      'scripts/mcp/base.test.mjs',
      'scripts/mcp/zeta.test.mjs',
    ]);
  } finally { removeRoot(rootDir); }
});

test('test glob 拒绝 shell 元字符文件名且不执行文件名内容', () => {
  const rootDir = createRoot();
  try {
    const marker = path.join(rootDir, 'owned');
    fs.writeFileSync(path.join(rootDir, 'scripts/mcp/evil;touch-owned.test.mjs'), '');
    assert.throws(
      () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [MCP_TEST_DISPLAY] }),
      hasCode('VALIDATION_TEST_FILENAME_UNSAFE'),
    );
    assert.equal(fs.existsSync(marker), false);
  } finally { removeRoot(rootDir); }
});

test('test glob 拒绝被项目 .gitignore 隐藏的可执行输入', () => {
  const rootDir = createRoot();
  try {
    fs.writeFileSync(path.join(rootDir, '.gitignore'), 'scripts/mcp/ignored.test.mjs\n');
    fs.writeFileSync(path.join(rootDir, 'scripts/mcp/ignored.test.mjs'), '');
    assert.throws(
      () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [MCP_TEST_DISPLAY] }),
      hasCode('VALIDATION_TEST_FILE_IGNORED'),
    );
  } finally { removeRoot(rootDir); }
});

test('test glob 拒绝 symlink、非普通文件和越界目录', async (context) => {
  await context.test('拒绝 symlink test 文件', () => {
    const rootDir = createRoot();
    try {
      fs.writeFileSync(path.join(rootDir, 'scripts/mcp/target.mjs'), '');
      fs.symlinkSync('target.mjs', path.join(rootDir, 'scripts/mcp/linked.test.mjs'));
      assert.throws(
        () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [MCP_TEST_DISPLAY] }),
        hasCode('VALIDATION_TEST_FILE_NOT_REGULAR'),
      );
    } finally { removeRoot(rootDir); }
  });

  await context.test('拒绝伪装成 test 文件的目录', () => {
    const rootDir = createRoot();
    try {
      fs.mkdirSync(path.join(rootDir, 'scripts/mcp/folder.test.mjs'));
      assert.throws(
        () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [MCP_TEST_DISPLAY] }),
        hasCode('VALIDATION_TEST_FILE_NOT_REGULAR'),
      );
    } finally { removeRoot(rootDir); }
  });

  await context.test('拒绝指向 root 外的 test 目录', () => {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-validation-registry-boundary-'));
    const rootDir = path.join(parent, 'root'), outside = path.join(parent, 'outside');
    try {
      fs.mkdirSync(path.join(rootDir, 'scripts'), { recursive: true });
      fs.mkdirSync(outside);
      fs.writeFileSync(path.join(outside, 'outside.test.mjs'), '');
      fs.symlinkSync(outside, path.join(rootDir, 'scripts/mcp'));
      assert.throws(
        () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [MCP_TEST_DISPLAY] }),
        hasCode('VALIDATION_TEST_DIRECTORY_UNSAFE'),
      );
    } finally { removeRoot(parent); }
  });
});

test('test glob 拒绝与仓外共享 inode 的 hardlink', {
  skip: process.platform === 'win32',
}, () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-validation-registry-hardlink-'));
  const rootDir = path.join(parent, 'root');
  try {
    fs.mkdirSync(path.join(rootDir, 'scripts/ci'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'scripts/mcp'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'scripts/ci/base.test.mjs'), '');
    fs.writeFileSync(path.join(rootDir, 'scripts/mcp/base.test.mjs'), '');
    runGit(rootDir, ['init', '-q']);
    runGit(rootDir, ['add', 'scripts/ci/base.test.mjs', 'scripts/mcp/base.test.mjs']);
    runGit(rootDir, ['commit', '-qm', 'fixture']);
    const outside = path.join(parent, 'outside.test.mjs');
    fs.writeFileSync(outside, '');
    fs.linkSync(outside, path.join(rootDir, 'scripts/mcp/hardlink.test.mjs'));

    assert.throws(
      () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [MCP_TEST_DISPLAY] }),
      hasCode('VALIDATION_TEST_FILE_NOT_REGULAR'),
    );
  } finally { removeRoot(parent); }
});

test('未知或重复的 display command 与 ID 均 fail closed', () => {
  const rootDir = createRoot();
  try {
    const display = JSONUTILS_VALIDATION_COMMAND_IDENTITIES[0].displayCommand;
    const id = JSONUTILS_VALIDATION_COMMAND_IDENTITIES[0].id;
    assert.throws(
      () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: ['node unknown.mjs'] }),
      hasCode('VALIDATION_COMMAND_DISPLAY_UNKNOWN'),
    );
    assert.throws(
      () => resolveJsonutilsValidationCommandDisplays({ rootDir, displayCommands: [display, display] }),
      hasCode('VALIDATION_COMMAND_DISPLAY_DUPLICATE'),
    );
    assert.throws(
      () => resolveJsonutilsValidationCommandIds({ rootDir, ids: ['unknown-id'] }),
      hasCode('VALIDATION_COMMAND_ID_UNKNOWN'),
    );
    assert.throws(
      () => resolveJsonutilsValidationCommandIds({ rootDir, ids: [id, id] }),
      hasCode('VALIDATION_COMMAND_ID_DUPLICATE'),
    );
  } finally { removeRoot(rootDir); }
});
