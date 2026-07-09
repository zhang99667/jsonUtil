import fs from 'node:fs';
import path from 'node:path';
import { collectGithubWorkflowRunBlocks } from './githubWorkflowRunBlocks.mjs';

export const AI_GOVERNANCE_SCHEDULED_WORKFLOW = '.github/workflows/ai-governance.yml';

const REQUIRED_COMMANDS = [
  'node scripts/ci/check-version-consistency.mjs',
  'node --test scripts/ci/*.test.mjs',
  'node --test scripts/mcp/*.test.mjs',
  'node scripts/ci/write-ai-governance-artifacts.mjs',
];

const collectWorkflowCommands = content => collectGithubWorkflowRunBlocks(content)
  .flatMap(block => block.content.split(/\r?\n/).map(line => line.trim()).filter(Boolean));

export const collectAiGovernanceScheduledWorkflowFailures = (rootDir) => {
  const workflowPath = path.join(rootDir, AI_GOVERNANCE_SCHEDULED_WORKFLOW);
  if (!fs.existsSync(workflowPath)) return [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 缺少定时 AI 治理 workflow`];

  const content = fs.readFileSync(workflowPath, 'utf8');
  const commands = new Set(collectWorkflowCommands(content));
  return [
    ...(!/^\s*schedule:\s*$/m.test(content) || !/^\s*-\s*cron:\s*['"][^'"]+['"]\s*$/m.test(content)
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须配置 cron schedule`] : []),
    ...(!/^\s*workflow_dispatch:\s*$/m.test(content)
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须保留 workflow_dispatch 手动触发`] : []),
    ...REQUIRED_COMMANDS
      .filter(command => !commands.has(command))
      .map(command => `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 缺少定时治理命令 "${command}"`),
    ...(!content.includes('uses: actions/upload-artifact@') || !content.includes('path: artifacts/ai-governance')
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须上传 AI governance artifacts`] : []),
  ];
};
