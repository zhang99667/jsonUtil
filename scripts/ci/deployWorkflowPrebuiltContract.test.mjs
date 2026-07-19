import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  collectGithubWorkflowCommands,
  collectGithubWorkflowJobBlocks,
  collectGithubWorkflowStepBlocks,
} from './aiGovernanceAutomationCommandContract.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const frontendBuildCommands = ['npm ci', 'npm run build', 'npm run check:preloads'];

const collectFrontendBuildStep = content => collectGithubWorkflowStepBlocks(
  collectGithubWorkflowJobBlocks(content).get('deploy') ?? ''
).find(step => step.includes('name: Build frontend dist')) ?? '';

const assertUnconditionalFrontendBuild = (content) => {
  const step = collectFrontendBuildStep(content);
  assert.notEqual(step, '', '部署任务必须包含前端构建步骤');
  assert.doesNotMatch(step, /^(?: {6}-\s*| {8})if:/m, '前端构建步骤不能声明 if');
  assert.deepEqual(collectGithubWorkflowCommands(step), frontendBuildCommands, '前端构建步骤必须精确执行三条命令');
};

const workflowFixture = ({ conditional = false, commands = frontendBuildCommands } = {}) => [
  'jobs:',
  '  deploy:',
  '    steps:',
  ...(conditional ? ["      - if: ${{ inputs.deploy_mode == 'prebuilt-frontend' }}"] : ['      - name: Build frontend dist']),
  ...(conditional ? ['        name: Build frontend dist'] : []),
  '        run: |',
  ...commands.map(command => `          ${command}`),
].join('\n');

test('真实部署工作流始终执行完整前端预构建', () => {
  const workflow = fs.readFileSync(path.join(rootDir, '.github/workflows/deploy.yml'), 'utf8');
  assertUnconditionalFrontendBuild(workflow);
});

test('名称之前的条件仍归入前端构建步骤并被拒绝', () => {
  const workflow = workflowFixture({ conditional: true });
  assert.match(collectFrontendBuildStep(workflow), /^      - if:/m);
  assert.throws(() => assertUnconditionalFrontendBuild(workflow), /前端构建步骤不能声明 if/);
});

test('前端预构建步骤不得删除固定命令', () => {
  const workflow = workflowFixture({ commands: frontendBuildCommands.slice(0, 2) });
  assert.throws(() => assertUnconditionalFrontendBuild(workflow), /前端构建步骤必须精确执行三条命令/);
});
