#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildVersionConsistencyReport,
  formatVersionConsistencyFailures,
} from './versionConsistencyCheck.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const report = buildVersionConsistencyReport(rootDir);

if (report.failures.length > 0) {
  console.error(formatVersionConsistencyFailures(report));
  process.exit(1);
}

console.log(`前端发布版本一致性检查通过: v${report.expectedVersion}`);
