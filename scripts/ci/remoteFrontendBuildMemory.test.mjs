import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const helperPath = path.join(rootDir, 'scripts/deploy/remote-frontend-build-memory.sh');

const runMemoryCheck = ({
  dockerfile = 'Dockerfile',
  minimumMiB = '4096',
  meminfo = 'MemAvailable: 5242880 kB\nSwapFree: 0 kB\n',
  createMeminfo = true,
} = {}) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-build-memory-'));
  const meminfoPath = path.join(tempDir, 'meminfo');
  if (createMeminfo) fs.writeFileSync(meminfoPath, meminfo);

  try {
    return spawnSync('bash', [
      '-c',
      [
        'set -Eeuo pipefail',
        '. "$1"',
        'FRONTEND_DOCKERFILE="$2"',
        'REMOTE_FRONTEND_BUILD_MIN_AVAILABLE_MIB="$3"',
        'check_remote_frontend_build_memory "$4"',
        'printf "compose-ready"',
      ].join('\n'),
      'bash',
      helperPath,
      dockerfile,
      minimumMiB,
      meminfoPath,
    ], { encoding: 'utf8' });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

test('远端前端源码构建在低内存主机上于 Compose 前失败', () => {
  const result = runMemoryCheck({
    meminfo: 'MemAvailable: 1038336 kB\nSwapFree: 962560 kB\n',
  });

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout, /compose-ready/);
  assert.match(result.stderr, /远端前端源码构建可用内存不足/);
  assert.match(result.stderr, /ssh-prebuilt-frontend-deploy\.sh/);
});

test('预构建前端不依赖远端内存信息', () => {
  const result = runMemoryCheck({
    dockerfile: 'Dockerfile.prebuilt',
    createMeminfo: false,
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /compose-ready/);
});

test('远端前端源码构建在可用内存达到门槛时继续', () => {
  const result = runMemoryCheck();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /compose-ready/);
});

test('远端前端源码构建无法可信读取内存或门槛时失败', () => {
  const unreadable = runMemoryCheck({ createMeminfo: false });
  assert.notEqual(unreadable.status, 0);
  assert.match(unreadable.stderr, /无法读取远端可用内存/);

  const invalidMinimum = runMemoryCheck({ minimumMiB: '4g' });
  assert.notEqual(invalidMinimum.status, 0);
  assert.match(invalidMinimum.stderr, /内存门槛必须是正整数/);

  const overflowingMinimum = runMemoryCheck({ minimumMiB: '9'.repeat(128) });
  assert.notEqual(overflowingMinimum.status, 0);
  assert.match(overflowingMinimum.stderr, /内存门槛必须是正整数/);
});

test('远端 Compose 在备份和构建服务之前执行内存守卫', () => {
  const remoteDeploy = fs.readFileSync(
    path.join(rootDir, 'scripts/deploy/remote-docker-compose-deploy.sh'),
    'utf8',
  );
  const sshDeploy = fs.readFileSync(
    path.join(rootDir, 'scripts/deploy/ssh-docker-compose-deploy.sh'),
    'utf8',
  );

  const guardIndex = remoteDeploy.indexOf('check_remote_frontend_build_memory');
  assert.ok(guardIndex > remoteDeploy.indexOf('remote-frontend-build-memory.sh'));
  assert.ok(guardIndex < remoteDeploy.indexOf('backup_frontend_legacy_assets'));
  assert.ok(guardIndex < remoteDeploy.indexOf('compose "${UP_ARGS[@]}"'));
  assert.match(sshDeploy, /declare -p[\s\S]*REMOTE_FRONTEND_BUILD_MIN_AVAILABLE_MIB/);
});
