#!/usr/bin/env node
// 项目级 validation plan component executor；默认只做零执行预检。

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runAiGovernanceValidationExecution } from './aiGovernanceValidationExecution.mjs';
import {
  buildAiGovernanceValidationExecutionFailureReport,
  isClosedAiGovernanceValidationExecutionReport,
} from './aiGovernanceValidationExecutionReceipt.mjs';

const USAGE = `Usage:
  node scripts/ci/run-ai-validation-execution.mjs [--run] [--json]

默认只生成零执行 preflight；只有显式 --run 才会启动固定注册表命令。`;
const ARGUMENT_ERROR = 'AI_VALIDATION_EXECUTION_ARGUMENTS_INVALID';

export const parseAiValidationExecutionArgs = (args) => {
  const allowed = new Set(['--run', '--json', '--help']);
  if (args.some(arg => !allowed.has(arg)) || new Set(args).size !== args.length
    || (args.includes('--help') && args.length !== 1)) return null;
  return { execute: args.includes('--run'), json: args.includes('--json'), help: args.includes('--help') };
};

export const runAiValidationExecutionCli = async ({
  args = process.argv.slice(2),
  rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  stdout = process.stdout,
  stderr = process.stderr,
  run = runAiGovernanceValidationExecution,
} = {}) => {
  const parsed = parseAiValidationExecutionArgs(args);
  if (!parsed) {
    stderr.write(`${USAGE}\nError: ${ARGUMENT_ERROR}\n`);
    return 2;
  }
  if (parsed.help) {
    stdout.write(`${USAGE}\n`);
    return 0;
  }
  let report;
  try {
    const candidate = await run({ rootDir, execute: parsed.execute });
    report = isClosedAiGovernanceValidationExecutionReport(candidate, parsed.execute)
      ? candidate
      : buildAiGovernanceValidationExecutionFailureReport({ requested: parsed.execute });
  } catch {
    report = buildAiGovernanceValidationExecutionFailureReport({ requested: parsed.execute });
  }
  stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : `AI validation execution: ${report.status}\n`);
  return report.ok ? 0 : 1;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAiValidationExecutionCli().then((exitCode) => { process.exitCode = exitCode; });
}
