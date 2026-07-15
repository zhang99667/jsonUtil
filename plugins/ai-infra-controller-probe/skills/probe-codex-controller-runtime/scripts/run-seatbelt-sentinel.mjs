#!/usr/bin/env node

import { runSeatbeltSentinel } from './seatbelt-sentinel.mjs';

try {
  const result = await runSeatbeltSentinel({ argv: process.argv.slice(2) });
  process.stdout.write(`${JSON.stringify({
    schemaVersion: 2,
    reportType: 'codex-seatbelt-sentinel-summary',
    status: result.report.result.status,
    evidenceScope: result.report.contract.evidenceScope,
    coverage: result.report.contract.coverage,
    runtimeSubsetExecutionObserved: result.report.result.runtimeSubsetExecutionObserved,
    reportSha256: result.reportSha256,
  })}\n`);
  process.exitCode = result.exitCode;
} catch {
  process.stderr.write('{"schemaVersion":2,"reportType":"codex-seatbelt-sentinel-error","error":"seatbelt-sentinel-failed"}\n');
  process.exitCode = 1;
}
