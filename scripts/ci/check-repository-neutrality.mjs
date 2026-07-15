#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectRepositoryNeutralityFailures } from './repositoryNeutralityCheck.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const failures = collectRepositoryNeutralityFailures(rootDir);

if (failures.length > 0) {
  console.error(`仓库中立性检查失败:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('仓库中立性检查通过');
