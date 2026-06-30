#!/usr/bin/env node
// 校验公网入口当前引用的前端静态资源，避免半部署导致懒加载 chunk 404。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProductionFrontendAssetAudit } from './productionFrontendAssetAudit.mjs';
import { parseProductionFrontendAssetCliArgs } from './productionFrontendAssetCliArgs.mjs';
import {
  shouldAllowInsecureProductionAssetTls,
  writeProductionFrontendAssetAuditResult,
} from './productionFrontendAssetCli.mjs';

if (shouldAllowInsecureProductionAssetTls()) {
  // 部署脚本可能用 IP 探活，保持与 curl -k 一致的显式证书容错能力。
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const runCli = async () => {
  const { baseUrl, extraAssetPaths, shouldPrintPaths } = parseProductionFrontendAssetCliArgs();
  const audit = await buildProductionFrontendAssetAudit(baseUrl, undefined, extraAssetPaths);
  const exitCode = writeProductionFrontendAssetAuditResult(audit, { shouldPrintPaths });
  if (exitCode !== 0) process.exit(exitCode);
};

const isCliEntry = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isCliEntry) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
