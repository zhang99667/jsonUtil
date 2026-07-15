import fs from 'node:fs';
import path from 'node:path';

import { checkBashSyntax } from './deployShellSyntaxRunner.mjs';
import {
  collectGithubWorkflowRunBlocks,
  containsGithubActionsExpression,
  normalizeGithubWorkflowShell,
} from './githubWorkflowRunBlocks.mjs';

export const checkGithubWorkflowRuns = (rootDir, workflowFiles, runner) => {
  const checkedWorkflowRuns = [];
  const failures = [];

  for (const file of workflowFiles) {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${file}: 文件不存在`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const block of collectGithubWorkflowRunBlocks(content)) {
      const label = `${file}:run:${block.startLine}`;
      checkedWorkflowRuns.push(label);
      if (containsGithubActionsExpression(block.content)) {
        failures.push(`${label}: run 脚本不得直接包含 GitHub Actions 表达式，请通过步骤 env 传入`);
      }
      const failure = checkBashSyntax(runner, label, ['-n'], {
        encoding: 'utf8',
        input: normalizeGithubWorkflowShell(block.content),
      });
      if (failure) failures.push(failure);
    }
  }

  return { checkedWorkflowRuns, failures };
};
