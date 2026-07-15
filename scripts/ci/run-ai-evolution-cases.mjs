#!/usr/bin/env node
// 只执行已审计的 AI 行为 eval 白名单，不接受自定义命令或路径。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AI_EVOLUTION_EXECUTABLE_CASE_IDS,
  runAiGovernanceEvolutionCases,
} from './aiGovernanceEvolutionCaseRunner.mjs';

const args = process.argv.slice(2);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const wantsJson = args.includes('--json');
const wantsList = args.includes('--list');
const wantsAll = args.includes('--all');
const caseIds = args.flatMap((arg, index) => arg === '--case' ? [args[index + 1]] : []).filter(Boolean);

if (wantsList) {
  const payload = { reportType: 'ai-governance-evolution-case-list', caseIds: AI_EVOLUTION_EXECUTABLE_CASE_IDS };
  console.log(wantsJson ? JSON.stringify(payload, null, 2) : payload.caseIds.join('\n'));
} else if ((wantsAll && caseIds.length > 0) || (!wantsAll && caseIds.length === 0)) {
  console.error('用法: node scripts/ci/run-ai-evolution-cases.mjs (--all | --case <case-id>) [--json]');
  process.exitCode = 2;
} else {
  try {
    const selectedIds = wantsAll ? AI_EVOLUTION_EXECUTABLE_CASE_IDS : caseIds;
    const report = runAiGovernanceEvolutionCases({ rootDir, caseIds: selectedIds });
    if (wantsJson) console.log(JSON.stringify(report, null, 2));
    else {
      report.results.forEach(result => console.log(`${result.status === 'passed' ? '✓' : '✗'} ${result.caseId} [${result.evidenceScope}]`));
      console.log(`AI evolution cases: ${report.counts.passed}/${report.counts.selected} passed`);
    }
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
