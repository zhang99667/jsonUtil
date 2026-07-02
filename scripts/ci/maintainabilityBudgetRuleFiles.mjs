import fs from 'node:fs';
import path from 'node:path';

export const getBudgetRuleFiles = (rootDir) => fs
  .readdirSync(path.join(rootDir, 'scripts/ci'))
  .filter(file => file.startsWith('maintainability-budget-') && file.endsWith('.mjs'))
  .map(file => `scripts/ci/${file}`);

export const collectUntrackedBudgetRuleFailures = (rootDir, budgetedFiles) => (
  getBudgetRuleFiles(rootDir)
    .filter(budgetRuleFile => !budgetedFiles.has(budgetRuleFile))
    .map(budgetRuleFile => `${budgetRuleFile}: 预算规则文件未纳入自检预算`)
);
