import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import {
  CANONICAL_CODEX_HOOK_CONFIG,
  CODEX_SESSION_START_HOOK_FILES,
  collectCodexHookFailures,
} from './aiGovernanceCodexHooks.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const RUNTIME_FILE = '.codex/hooks/session-start-governance.mjs';
const REQUIRED_ENTRYPOINTS = [
  'AGENTS.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-EVOLUTION-PLAYBOOK.md',
];

const writeHookFixture = (rootDir) => {
  CODEX_SESSION_START_HOOK_FILES.forEach((file) => {
    writeFixtureFile(rootDir, file, fs.readFileSync(file, 'utf8'));
  });
  REQUIRED_ENTRYPOINTS.forEach(file => writeFixtureFile(rootDir, file, 'fixture'));
};

const runHook = (rootDir, payload) => spawnSync(process.execPath, [path.join(rootDir, RUNTIME_FILE)], {
  cwd: path.join(rootDir, 'docs'),
  input: typeof payload === 'string' ? payload : JSON.stringify(payload),
  encoding: 'utf8',
  timeout: 2_000,
  maxBuffer: 8 * 1024,
});

const validPayload = { hook_event_name: 'SessionStart', source: 'startup', cwd: '/redacted' };
const sessionStartSources = ['startup', 'resume', 'clear', 'compact'];
const healthyOutput = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: 'JSONUtils governance handoff v1: read AGENTS.md and both AI playbooks before changing rules, skills, MCP, hooks or evals; component checks do not prove behavior outcomes.',
  },
};

test('Codex SessionStart hook 固定单事件、短 timeout 和跨平台根目录定位', () => {
  assert.deepEqual(collectCodexHookFailures(process.cwd()), []);
  const config = JSON.parse(CANONICAL_CODEX_HOOK_CONFIG);
  assert.deepEqual(Object.keys(config.hooks), ['SessionStart']);
  assert.equal(config.hooks.SessionStart[0].matcher, 'startup|resume|clear|compact');
  assert.match(config.hooks.SessionStart[0].hooks[0].command, /git rev-parse --show-toplevel/);
  assert.match(config.hooks.SessionStart[0].hooks[0].commandWindows, /Join-Path \$root/);
  assert.equal(config.hooks.SessionStart[0].hooks[0].timeout, 10);
});

test('Codex SessionStart runtime 从子目录返回固定且有界的 advisory context', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeHookFixture(rootDir);
    sessionStartSources.forEach((source) => {
      const result = runHook(rootDir, { ...validPayload, source });
      assert.equal(result.status, 0);
      assert.equal(result.stderr, '');
      assert.ok(Buffer.byteLength(result.stdout) < 1024);
      assert.deepEqual(JSON.parse(result.stdout), healthyOutput);
    });
  });
});

test('Codex SessionStart runtime 对 clear/compact 重复调用保持确定且零写入', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeHookFixture(rootDir);
    const before = REQUIRED_ENTRYPOINTS.map(file => fs.readFileSync(path.join(rootDir, file)));
    const outputs = ['clear', 'compact', 'clear', 'compact'].map((source) => {
      const result = runHook(rootDir, { ...validPayload, source });
      assert.equal(result.status, 0);
      assert.equal(result.stderr, '');
      assert.deepEqual(JSON.parse(result.stdout), healthyOutput);
      return result.stdout;
    });
    assert.equal(new Set(outputs).size, 1);
    const after = REQUIRED_ENTRYPOINTS.map(file => fs.readFileSync(path.join(rootDir, file)));
    assert.deepEqual(after, before);
  });
});

test('Codex SessionStart runtime 对非法、超限和错误事件输入 fail open 且不回显正文', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeHookFixture(rootDir);
    const sentinel = 'SYNTHETIC_PRIVATE_SENTINEL';
    const payloads = [
      `{not-json:${sentinel}`,
      JSON.stringify({ hook_event_name: 'PreToolUse', source: 'startup', prompt: sentinel }),
      JSON.stringify({ hook_event_name: 'SessionStart', source: 'unknown', prompt: sentinel }),
      JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', extra: sentinel.padEnd(70 * 1024, 'x') }),
    ];
    payloads.forEach((payload) => {
      const result = runHook(rootDir, payload);
      assert.equal(result.status, 0);
      assert.equal(result.stderr, '');
      assert.doesNotMatch(result.stdout, new RegExp(sentinel));
      const output = JSON.parse(result.stdout);
      assert.equal(output.systemMessage, 'JSONUtils governance entrypoints need review.');
      assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
    });
  });
});

test('Codex SessionStart runtime 将缺失或 symlink 入口降级为固定非阻断提示', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeHookFixture(rootDir);
    fs.rmSync(path.join(rootDir, 'AGENTS.md'));
    let output = JSON.parse(runHook(rootDir, validPayload).stdout);
    assert.equal(output.systemMessage, 'JSONUtils governance entrypoints need review.');
    writeFixtureFile(rootDir, 'target.md', 'fixture');
    fs.symlinkSync(path.join(rootDir, 'target.md'), path.join(rootDir, 'AGENTS.md'));
    output = JSON.parse(runHook(rootDir, { ...validPayload, source: 'resume' }).stdout);
    assert.equal(output.systemMessage, 'JSONUtils governance entrypoints need review.');
  });
});

test('Codex hook 契约拒绝配置扩权、symlink 和 runtime 能力漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeHookFixture(rootDir);
    writeFixtureFile(rootDir, '.codex/hooks.json', CANONICAL_CODEX_HOOK_CONFIG.replace('"SessionStart"', '"PreToolUse"'));
    assert.match(collectCodexHookFailures(rootDir).join('\n'), /canonical 闭字段配置/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeHookFixture(rootDir);
    const runtime = path.join(rootDir, RUNTIME_FILE);
    const target = path.join(rootDir, '.codex/hooks/runtime-target.mjs');
    fs.renameSync(runtime, target);
    fs.symlinkSync(target, runtime);
    assert.match(collectCodexHookFailures(rootDir).join('\n'), /不能是 symlink/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeHookFixture(rootDir);
    fs.appendFileSync(path.join(rootDir, RUNTIME_FILE), '\nprocess.env.SYNTHETIC_VALUE;\n');
    const failures = collectCodexHookFailures(rootDir).join('\n');
    assert.match(failures, /内容摘要与已审计 runtime 不一致/);
    assert.match(failures, /禁止环境变量读取/);
  });
});
