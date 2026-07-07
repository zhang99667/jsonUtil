import fs from 'node:fs';
import path from 'node:path';
import { CI_COMMAND_COLLECTORS } from './aiGovernanceCiCommandCollectors.mjs';

const REQUIRED_AI_GOVERNANCE_CI_COMMANDS = ['node scripts/ci/check-version-consistency.mjs',
  'node --test scripts/ci/*.test.mjs', 'node scripts/ci/check-ai-governance.mjs',
  'node scripts/ci/check-maintainability-budgets.mjs'];

export const collectAiGovernanceCiContractFailures = (rootDir) => (
  Object.entries(CI_COMMAND_COLLECTORS).flatMap(([file, collectCommands]) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return [`${file}: 缺少 AI 治理自动化入口`];

    const commands = new Set(collectCommands(fs.readFileSync(filePath, 'utf8')));
    return REQUIRED_AI_GOVERNANCE_CI_COMMANDS
      .filter(command => !commands.has(command))
      .map(command => `${file}: 缺少 AI 治理自动化命令 "${command}"`);
  })
);
