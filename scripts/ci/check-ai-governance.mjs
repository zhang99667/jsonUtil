#!/usr/bin/env node
// 校验 AI 协作入口、Playbook 和 Codex skill 是否保持可发现、可执行。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAiGovernanceReport } from './aiGovernanceChecks.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const report = buildAiGovernanceReport(rootDir);

if (report.missingFiles.length > 0 || report.missingReferences.length > 0) {
  if (report.missingFiles.length > 0) {
    console.error('AI 协作资产缺少以下文件:');
    report.missingFiles.forEach(file => console.error(`- ${file}`));
  }

  if (report.missingReferences.length > 0) {
    console.error('AI 协作资产缺少以下关键引用:');
    report.missingReferences.forEach(message => console.error(`- ${message}`));
  }

  process.exit(1);
}

console.log(
  `AI 协作治理校验通过，共 ${report.requiredFiles.length} 个关键文件、` +
  `${report.referenceRules.length} 组引用规则。`
);
