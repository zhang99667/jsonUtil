#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkDeployShellSyntax } from './deployShellSyntaxCheck.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const report = checkDeployShellSyntax(rootDir);

if (report.failures.length > 0) {
  console.error('部署 Shell 语法检查失败:');
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`部署 Shell 语法检查通过，共 ${report.checkedFiles.length} 个文件、${report.checkedHeredocs.length} 个 heredoc 片段、${report.checkedWorkflowRuns.length} 个 workflow run 块。`);
for (const item of [...report.checkedFiles, ...report.checkedHeredocs, ...report.checkedWorkflowRuns]) {
  console.log(`- ${item}`);
}
