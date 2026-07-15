import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  PROJECT_AI_INFRA_AUDITOR_ADAPTERS,
  PROJECT_AI_INFRA_AUDITOR_INSTRUCTIONS,
  collectProjectAiInfraAuditorFailures,
  renderProjectAiInfraAuditorAdapter,
} from './aiGovernanceProjectAiInfraAuditor.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const writeValidAdapters = rootDir => PROJECT_AI_INFRA_AUDITOR_ADAPTERS.forEach((descriptor) => {
  writeFixtureFile(rootDir, descriptor.file, renderProjectAiInfraAuditorAdapter(descriptor));
});

test('project ai-infra-auditor 精确派生 Codex、Claude 与 Copilot 项目 Agent', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    assert.deepEqual(collectProjectAiInfraAuditorFailures(rootDir), []);
    assert.deepEqual(PROJECT_AI_INFRA_AUDITOR_ADAPTERS.map(item => item.file), [
      '.codex/agents/ai-infra-auditor.toml',
      '.claude/agents/ai-infra-auditor.md',
      '.github/agents/ai-infra-auditor.agent.md',
    ]);
  });
});

test('project ai-infra-auditor 拒绝缺失、symlink 与任意字节漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const claudeFile = '.claude/agents/ai-infra-auditor.md';
    fs.rmSync(path.join(rootDir, claudeFile));
    assert.match(collectProjectAiInfraAuditorFailures(rootDir).join('\n'), /Claude.*不存在/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const githubFile = '.github/agents/ai-infra-auditor.agent.md';
    const target = path.join(rootDir, 'github-agent-target.md');
    fs.renameSync(path.join(rootDir, githubFile), target);
    fs.symlinkSync(target, path.join(rootDir, githubFile));
    assert.match(collectProjectAiInfraAuditorFailures(rootDir).join('\n'), /Copilot.*普通文件/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const codexFile = '.codex/agents/ai-infra-auditor.toml';
    fs.appendFileSync(path.join(rootDir, codexFile), 'model = "example"\n');
    assert.match(collectProjectAiInfraAuditorFailures(rootDir).join('\n'), /Codex.*canonical 模板/);
  });
});

test('project ai-infra-auditor 三端都不得扩张写入、shell 或 MCP 工具', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const claudeFile = path.join(rootDir, '.claude/agents/ai-infra-auditor.md');
    fs.writeFileSync(claudeFile, fs.readFileSync(claudeFile, 'utf8').replace('tools: Read, Grep, Glob', 'tools: Read, Grep, Glob, Bash, Edit'));
    assert.match(collectProjectAiInfraAuditorFailures(rootDir).join('\n'), /Claude.*canonical 模板/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const githubFile = path.join(rootDir, '.github/agents/ai-infra-auditor.agent.md');
    fs.writeFileSync(githubFile, fs.readFileSync(githubFile, 'utf8').replace('tools: ["read", "search"]', 'tools: ["read", "search", "edit", "execute"]'));
    assert.match(collectProjectAiInfraAuditorFailures(rootDir).join('\n'), /Copilot.*canonical 模板/);
  });
});

test('project ai-infra-auditor 拒绝 Claude 与 Copilot 目录中的额外未审计 Agent', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    writeFixtureFile(rootDir, '.claude/agents/write-all.md', 'tools: Read, Bash, Edit\n');
    writeFixtureFile(rootDir, '.github/agents/write-all.agent.md', 'tools: [read, edit, execute]\n');
    assert.deepEqual(collectProjectAiInfraAuditorFailures(rootDir), [
      '.claude/agents/write-all.md: 未审计的 Claude 项目 Agent',
      '.github/agents/write-all.agent.md: 未审计的 Copilot 项目 Agent',
    ]);
  });
});

test('project ai-infra-auditor 锁定正向触发、近负例与 component-only 边界', () => {
  [
    '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md',
    'rules、skills、MCP、plugins、hooks、evals 或治理成熟度',
    '普通业务功能、产品内 AI 能力、单文件解释或实现修复',
    '不得编辑、创建、删除、重命名或 chmod',
    'component evidence',
    'behavior outcome 保持 unknown',
    '完整 workspace manifest',
    '修改文件：无',
  ].forEach(snippet => assert.match(PROJECT_AI_INFRA_AUDITOR_INSTRUCTIONS, new RegExp(snippet)));
});

test('project ai-infra-auditor 当前工作区适配器与 canonical renderer 一致', () => {
  assert.deepEqual(collectProjectAiInfraAuditorFailures(process.cwd()), []);
});
