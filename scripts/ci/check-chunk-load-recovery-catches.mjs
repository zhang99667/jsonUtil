#!/usr/bin/env node
// 校验手动懒加载 catch 是否接入统一 chunk 恢复提示，避免发布后旧页面暴露原始构建产物错误。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildChunkLoadRecoveryCatchReport } from './chunkLoadRecoveryCatchAudit.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const report = buildChunkLoadRecoveryCatchReport(rootDir);

if (report.failures.length > 0) {
  console.error('以下手动懒加载 catch 缺少 chunk 加载失败恢复兜底:');
  report.failures.forEach((failure) => {
    console.error(`- ${failure.file}:${failure.line} ${failure.message}`);
  });
  process.exit(1);
}

console.log(`手动懒加载恢复兜底检查通过，共检查 ${report.checkedFiles.length} 个前端源码文件。`);
