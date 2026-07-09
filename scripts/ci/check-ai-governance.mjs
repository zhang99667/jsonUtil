#!/usr/bin/env node
// 校验 AI 协作入口、Playbook 和 Codex skill 是否保持可发现、可执行。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatAiGovernanceJsonReport,
  hasAiGovernanceFailures,
  printAiGovernanceHumanReport,
} from './aiGovernanceCliOutput.mjs';
import { buildAiGovernanceReport } from './aiGovernanceReport.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const report = buildAiGovernanceReport(rootDir);
const outputJson = process.argv.includes('--json');

if (outputJson) process.stdout.write(formatAiGovernanceJsonReport(report));

if (hasAiGovernanceFailures(report)) {
  if (!outputJson) printAiGovernanceHumanReport(report);
  process.exit(1);
}

if (!outputJson) printAiGovernanceHumanReport(report);
