import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  AI_GOVERNANCE_CODEX_AGENT_PROFILE_FILES,
  collectCodexAgentProfileFailures,
} from './aiGovernanceCodexAgentProfiles.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const copyProfiles = (rootDir) => AI_GOVERNANCE_CODEX_AGENT_PROFILE_FILES.forEach((file) => {
  writeFixtureFile(rootDir, file, fs.readFileSync(file, 'utf8'));
});

const withProfiles = (run) => withAiGovernanceTempRoot((rootDir) => {
  copyProfiles(rootDir);
  run(rootDir);
});

test('Codex agent profiles 固定 explorer、worker、verifier 的角色与 sandbox 边界', () => {
  assert.deepEqual(collectCodexAgentProfileFailures(process.cwd()), []);
});

test('Codex agent profile 契约拒绝缺失、多余和 symlink profile', () => {
  withProfiles((rootDir) => {
    fs.rmSync(path.join(rootDir, '.codex/agents/explorer.toml'));
    writeFixtureFile(rootDir, '.codex/agents/reviewer.toml', 'name = "reviewer"\n');
    assert.deepEqual(collectCodexAgentProfileFailures(rootDir).slice(0, 2), [
      '.codex/agents/explorer.toml: 缺少固定 Codex agent profile',
      '.codex/agents/reviewer.toml: 未审计的 Codex agent profile',
    ]);
  });
  withProfiles((rootDir) => {
    const target = path.join(rootDir, '.codex/agents/worker-target.toml');
    fs.renameSync(path.join(rootDir, '.codex/agents/worker.toml'), target);
    fs.symlinkSync(target, path.join(rootDir, '.codex/agents/worker.toml'));
    assert.match(collectCodexAgentProfileFailures(rootDir).join('\n'), /worker-target.*未审计|worker\.toml: 必须是普通文件/);
  });
});

test('Codex agent profile 契约拒绝字段扩权、名称漂移和错误 sandbox', () => {
  withProfiles((rootDir) => {
    const file = path.join(rootDir, '.codex/agents/explorer.toml');
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, source.replace('name = "explorer"', 'name = "planner"'));
    assert.match(collectCodexAgentProfileFailures(rootDir).join('\n'), /name 必须等于文件名/);
  });
  withProfiles((rootDir) => {
    const file = path.join(rootDir, '.codex/agents/explorer.toml');
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, source.replace('sandbox_mode = "read-only"', 'sandbox_mode = "danger-full-access"'));
    assert.match(collectCodexAgentProfileFailures(rootDir).join('\n'), /sandbox_mode 必须为 read-only/);
  });
  withProfiles((rootDir) => {
    const file = path.join(rootDir, '.codex/agents/worker.toml');
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, source.replace('description = ', 'model = "example"\ndescription = '));
    assert.match(collectCodexAgentProfileFailures(rootDir).join('\n'), /闭字段 canonical TOML/);
  });
});

test('Codex agent profile 契约拒绝职责与固定回传模板缺口', () => {
  withProfiles((rootDir) => {
    const file = path.join(rootDir, '.codex/agents/worker.toml');
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, source.replaceAll('写入白名单', '允许文件'));
    assert.match(collectCodexAgentProfileFailures(rootDir).join('\n'), /缺少 写入白名单/);
  });
  withProfiles((rootDir) => {
    const file = path.join(rootDir, '.codex/agents/verifier.toml');
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, source.replace('下一步建议：', '后续：'));
    assert.match(collectCodexAgentProfileFailures(rootDir).join('\n'), /缺少 下一步建议：/);
  });
});
