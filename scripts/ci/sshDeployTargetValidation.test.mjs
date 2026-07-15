import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const helperPath = path.join(rootDir, 'scripts/deploy/ssh-common.sh');

const validateTarget = (overrides = {}) => spawnSync('bash', [
  '-c',
  [
    'set -Eeuo pipefail',
    '. "$1"',
    'init_ssh_deploy_defaults',
    'validate_ssh_deploy_target',
    'printf "%s|%s|%s|%s" "$SSH_HOST" "$SSH_USER" "$SSH_PORT" "$REMOTE_APP_DIR"',
  ].join('\n'),
  'bash',
  helperPath,
], {
  encoding: 'utf8',
  env: {
    ...process.env,
    SSH_HOST: 'deploy.example.com',
    SSH_USER: 'deploy_user',
    SSH_PORT: '22',
    REMOTE_APP_DIR: '/srv/jsonutils',
    ...overrides,
  },
});

test('SSH 部署目标校验接受闭合的连接参数', () => {
  const result = validateTarget();

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'deploy.example.com|deploy_user|22|/srv/jsonutils');
});

test('SSH 部署目标校验拒绝命令注入与危险目录', () => {
  const invalidTargets = [
    { SSH_HOST: 'deploy.example.com; touch /tmp/host-injected' },
    { SSH_USER: 'deploy\nwhoami' },
    { SSH_PORT: '22 -o ProxyCommand=whoami' },
    { SSH_PORT: '9'.repeat(128) },
    { REMOTE_APP_DIR: "/srv/jsonutils'; touch /tmp/path-injected; #" },
    { REMOTE_APP_DIR: '/' },
    ...['//', '///'].map(REMOTE_APP_DIR => ({ REMOTE_APP_DIR })),
    { REMOTE_APP_DIR: '/srv/jsonutils/../' },
  ];

  for (const target of invalidTargets) {
    const result = validateTarget(target);
    assert.notEqual(result.status, 0, JSON.stringify(target));
    assert.match(result.stderr, /SSH 部署参数非法/);
  }
});

test('Deploy 工作流在 SSH 联网前校验部署目标', () => {
  const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/deploy.yml'), 'utf8');
  assert.match(workflow, /validate_ssh_deploy_target[\s\S]*ssh-keyscan/);
});

test('远端 Bash 只从标准输入接收转义后的动态值', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-remote-bash-'));
  const markerPath = path.join(tempDir, 'injected');
  const dangerousValue = `$(touch ${markerPath})'; echo injected; #`;

  try {
    const captured = spawnSync('bash', [
      '-c',
      [
        'set -Eeuo pipefail',
        '. "$1"',
        'SSH_BASE_OPTS=(-p 22)',
        'SSH_USER=deploy_user',
        'SSH_HOST=deploy.example.com',
        'ssh() { printf "%s\\n" "$@" >&2; cat; }',
        'HEALTH_CHECK_URLS="$2"',
        '{',
        '  declare -p HEALTH_CHECK_URLS',
        "  printf '%s\\n' 'printf \"%s\" \"$HEALTH_CHECK_URLS\"'",
        '} | run_remote_bash',
      ].join('\n'),
      'bash',
      helperPath,
      dangerousValue,
    ], { encoding: 'utf8' });

    assert.equal(captured.status, 0, captured.stderr);
    assert.doesNotMatch(captured.stderr, /touch|injected/);

    const executed = spawnSync('bash', ['-s'], {
      encoding: 'utf8',
      input: captured.stdout,
    });
    assert.equal(executed.status, 0, executed.stderr);
    assert.equal(executed.stdout, dangerousValue);
    assert.equal(fs.existsSync(markerPath), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
