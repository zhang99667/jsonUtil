#!/usr/bin/env node
// 校验已知复杂模块和新拆分 helper 的行数预算，防止可维护性债务反弹。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { maintainabilityBudgets } from './maintainability-budget-rules.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const countLines = (filePath) => {
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text) return 0;
  return text.endsWith('\n')
    ? text.split('\n').length - 1
    : text.split('\n').length;
};

const failures = [];
const summaries = [];
const budgetedFiles = new Set(maintainabilityBudgets.map(budget => budget.file));
const budgetRuleFiles = fs
  .readdirSync(path.join(rootDir, 'scripts/ci'))
  .filter(file => file.startsWith('maintainability-budget-') && file.endsWith('.mjs'))
  .map(file => `scripts/ci/${file}`);

for (const budgetRuleFile of budgetRuleFiles) {
  if (!budgetedFiles.has(budgetRuleFile)) {
    failures.push(`${budgetRuleFile}: 预算规则文件未纳入自检预算`);
  }
}

for (const budget of maintainabilityBudgets) {
  const filePath = path.join(rootDir, budget.file);
  if (!fs.existsSync(filePath)) {
    failures.push(`${budget.file}: 文件不存在，无法检查预算`);
    continue;
  }

  const lineCount = countLines(filePath);
  summaries.push(`${budget.file}: ${lineCount}/${budget.maxLines}`);
  if (lineCount > budget.maxLines) {
    failures.push(`${budget.file}: ${lineCount}/${budget.maxLines} 行，${budget.reason}`);
  }
}

if (failures.length > 0) {
  console.error('可维护性预算检查失败:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`可维护性预算检查通过，共 ${maintainabilityBudgets.length} 个文件。`);
for (const summary of summaries) {
  console.log(`- ${summary}`);
}
