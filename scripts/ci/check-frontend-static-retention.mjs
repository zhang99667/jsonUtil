#!/usr/bin/env node
// 校验前端容器发布后仍保留近期旧 hash 静态资源。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectStaticRetentionConfigFailures,
  staticRetentionEntrypointFile,
} from './frontendStaticRetentionConfig.mjs';
import { runStaticRetentionScenario } from './frontendStaticRetentionScenario.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [
  ...collectStaticRetentionConfigFailures(rootDir),
  ...runStaticRetentionScenario(rootDir, staticRetentionEntrypointFile),
];

if (failures.length > 0) {
  console.error('前端静态资源保留校验失败:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('前端静态资源保留校验通过：新产物覆盖、近期旧 hash 保留、过期旧 hash 清理。');
