import fs from 'node:fs';
import path from 'node:path';
import { CI_COMMAND_COLLECTORS } from './aiGovernanceCiCommandCollectors.mjs';
import { REQUIRED_AI_GOVERNANCE_CI_COMMANDS, REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS } from './aiGovernanceCiCommandDescriptors.mjs';
import {
  collectOutcomeWriterAutomationWriteFailures,
  collectRequiredWorkflowCommandReachabilityFailures,
} from './aiGovernanceScheduledWorkflowContract.mjs';
import { collectGithubWorkflowRunBlocks } from './githubWorkflowRunBlocks.mjs';

export const collectAiGovernanceCiContractFailures = rootDir => Object.entries(CI_COMMAND_COLLECTORS)
  .flatMap(([file, collectCommands]) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return [`${file}: 缺少 AI 治理自动化入口`];
    const content = fs.readFileSync(filePath, 'utf8');
    const commands = new Set(collectCommands(content));
    const requiredCommands = file === 'scripts/ci/local-ci.sh'
      ? REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS : REQUIRED_AI_GOVERNANCE_CI_COMMANDS;
    const failures = requiredCommands
      .filter(command => !commands.has(command))
      .map(command => `${file}: 缺少 AI 治理自动化命令 "${command}"`);
    const commandBlocks = file === '.github/workflows/ci.yml'
      ? collectGithubWorkflowRunBlocks(content).map(block => block.content)
      : [...commands];
    failures.push(...collectOutcomeWriterAutomationWriteFailures(commandBlocks, file));
    if (file === '.github/workflows/ci.yml') {
      failures.push(...collectRequiredWorkflowCommandReachabilityFailures(content, requiredCommands, file));
      if (!/uses:\s*actions\/checkout@[^\n]+[\s\S]{0,160}fetch-depth:\s*0/.test(content)) {
        failures.push(`${file}: checkout 必须保留完整 Git 历史`);
      }
    }
    return failures;
  });
