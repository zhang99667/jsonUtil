#!/usr/bin/env node
import { runControllerProbe } from './controller-probe.mjs';

try {
  const result = await runControllerProbe({ argv: process.argv.slice(2) });
  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    reportType: 'codex-controller-probe-summary',
    status: result.report.result.status,
    runtimeProbeObserved: result.report.result.runtimeProbeObserved,
    evidenceScope: result.report.contract.evidenceScope,
    coverage: result.report.contract.coverage,
    outputPath: result.outputPath,
  })}\n`);
  process.exitCode = result.exitCode;
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    schemaVersion: 1,
    reportType: 'codex-controller-probe-error',
    error: error instanceof Error ? error.message : 'unknown-error',
  })}\n`);
  process.exitCode = 1;
}
