#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectAiGovernanceArtifactFreshnessFailures } from './writeAiGovernanceArtifactFreshness.mjs';
import { buildAiGovernanceArtifactPayloads } from './writeAiGovernanceArtifactPayloads.mjs';

const DEFAULT_ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_OUT_DIR = 'artifacts/ai-governance';

const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const runJsonReport = (rootDir, script, args) => {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  try {
    return { exitCode: result.status ?? 0, report: JSON.parse(result.stdout) };
  } catch {
    return {
      exitCode: result.status ?? 1,
      report: { ok: false, parseError: `无法解析 ${script} 的 JSON 输出`, stdout: result.stdout, stderr: result.stderr },
    };
  }
};

export const writeAiGovernanceArtifacts = ({
  rootDir = DEFAULT_ROOT_DIR,
  outDir = DEFAULT_OUT_DIR,
  summaryFile = process.env.GITHUB_STEP_SUMMARY,
  top = 35,
  contextTop = 5,
  now = () => new Date(),
  runReport = (script, args) => runJsonReport(rootDir, script, args),
} = {}) => {
  const result = buildAiGovernanceArtifactPayloads({ rootDir, outDir, top, contextTop, now, runReport });
  fs.mkdirSync(result.outputDir, { recursive: true });
  writeJson(result.files.governance, result.artifacts.governance);
  writeJson(result.files.evolution, result.artifacts.evolution);
  writeJson(result.files.maintainability, result.artifacts.maintainability);
  writeJson(result.files.context, result.artifacts.context);
  writeJson(result.files.scorecard, result.artifacts.scorecard);
  writeJson(result.files.attestationSubject, result.artifacts.attestationSubject);
  fs.writeFileSync(result.files.summary, result.artifacts.summary);
  if (summaryFile) fs.appendFileSync(summaryFile, result.artifacts.summary);

  return result;
};

export const checkAiGovernanceArtifactsFreshness = (options = {}) => {
  const result = buildAiGovernanceArtifactPayloads({
    rootDir: DEFAULT_ROOT_DIR,
    outDir: DEFAULT_OUT_DIR,
    ...options,
    runReport: options.runReport ?? ((script, args) => runJsonReport(options.rootDir ?? DEFAULT_ROOT_DIR, script, args)),
  });
  const freshnessFailures = collectAiGovernanceArtifactFreshnessFailures(result);
  return { ...result, freshnessFailures, ok: result.ok && freshnessFailures.length === 0 };
};

export const buildAiGovernanceArtifactFreshnessReport = (result, rootDir = DEFAULT_ROOT_DIR) => ({
  schemaVersion: 1,
  reportType: 'ai-governance-artifact-freshness',
  ok: result.ok,
  generatedAt: result.generatedAt,
  outputDir: path.relative(rootDir, result.outputDir),
  checkedArtifacts: Object.fromEntries(
    Object.entries(result.files).map(([id, file]) => [id, path.relative(rootDir, file)]),
  ),
  failures: (result.freshnessFailures ?? []).map(failure => ({
    ...failure,
    file: path.relative(rootDir, failure.file),
  })),
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const shouldCheck = process.argv.includes('--check');
  const shouldJson = process.argv.includes('--json');
  const result = shouldCheck ? checkAiGovernanceArtifactsFreshness() : writeAiGovernanceArtifacts();
  if (shouldJson && shouldCheck) {
    console.log(JSON.stringify(buildAiGovernanceArtifactFreshnessReport(result), null, 2));
  } else {
    const action = shouldCheck ? 'checked' : 'written to';
    console.log(`AI governance artifacts ${action} ${path.relative(process.cwd(), result.outputDir)}`);
    result.freshnessFailures?.forEach(failure => console.error(`${failure.id}: ${failure.reason} (${failure.file})`));
  }
  if (!result.ok) process.exitCode = 1;
}
