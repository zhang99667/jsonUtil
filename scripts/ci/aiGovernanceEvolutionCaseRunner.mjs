import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  AI_EVOLUTION_EXECUTABLE_CASE_IDS,
  AI_EVOLUTION_EXECUTABLE_CASES,
} from './aiGovernanceEvolutionExecutableCases.mjs';
import {
  classifyEvolutionCaseCommandFailure,
  countEvolutionCaseFailureClasses,
  resolveEvolutionCaseCommand,
  summarizeEvolutionCaseFailures,
} from './aiGovernanceEvolutionCaseFailure.mjs';
import { buildHermeticGitEnvironment, resolveHermeticGitExecutable } from './aiGovernanceHermeticGitInventory.mjs';

export { AI_EVOLUTION_EXECUTABLE_CASE_IDS, AI_EVOLUTION_EXECUTABLE_CASES };

const defaultRunCommand = (args, rootDir, commandEnv) => spawnSync(process.execPath, args, {
  cwd: rootDir,
  ...(commandEnv ? { env: commandEnv } : {}),
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: 120_000,
  maxBuffer: 4 * 1024 * 1024,
});
const defaultCommandEnvironment = (rootDir) => {
  const git = resolveHermeticGitExecutable(rootDir), base = buildHermeticGitEnvironment(git);
  const home = path.isAbsolute(process.env.HOME ?? '') ? process.env.HOME : base.HOME;
  const temporary = [process.env.TMPDIR, process.env.TMP, process.env.TEMP].find(value => path.isAbsolute(value ?? '')) ?? os.tmpdir();
  return { ...base, PATH: [...new Set([path.dirname(process.execPath), path.dirname(git), '/usr/bin', '/bin'])].join(path.delimiter),
    HOME: home, CODEX_HOME: path.isAbsolute(process.env.CODEX_HOME ?? '') ? process.env.CODEX_HOME : path.join(home, '.codex'),
    TMPDIR: temporary, TMP: temporary, TEMP: temporary };
};

export const getAiGovernanceEvolutionCaseCommands = ({ rootDir, caseId }) => {
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[caseId];
  if (!descriptor) throw new Error(`不支持的 AI evolution case: ${caseId}`);
  return descriptor.argsList.map(command => resolveEvolutionCaseCommand(command, rootDir).display);
};

export const runAiGovernanceEvolutionCases = ({ rootDir, caseIds, runCommand = defaultRunCommand, commandEnv }) => {
  const selectedIds = caseIds?.length ? [...new Set(caseIds)] : [];
  if (selectedIds.length === 0) throw new Error('至少选择一个 AI evolution case');
  const unknownIds = selectedIds.filter(id => !AI_EVOLUTION_EXECUTABLE_CASES[id]);
  if (unknownIds.length > 0) throw new Error(`不支持的 AI evolution case: ${unknownIds.join(', ')}`);
  const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
  const runtimeEnvironment = commandEnv ?? defaultCommandEnvironment(rootDir);
  const corpusCases = new Map(corpus.cases.map(item => [item.id, item]));
  const results = selectedIds.map((caseId) => {
    const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[caseId];
    const corpusCase = corpusCases.get(caseId);
    const versionMatches = corpusCase?.caseVersion === descriptor.caseVersion
      && corpusCase?.subject?.version === descriptor.subjectVersion;
    if (!versionMatches) return {
      caseId,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      status: 'failed',
      evidenceScope: descriptor.evidenceScope,
      outcomeEligible: false,
      failureClass: 'infrastructure-invalid',
      reasonCode: 'fixed-case-binding-mismatch',
      diagnostic: 'caseVersion 或 subjectVersion 与固定 runner 不一致',
    };
    const validations = descriptor.argsList.map((command) => {
      const resolved = resolveEvolutionCaseCommand(command, rootDir);
      const { args, display } = resolved;
      const commandResult = runCommand(args, rootDir, runtimeEnvironment);
      const status = commandResult.status === 0 ? 'passed' : 'failed';
      const defaultFailureClass = descriptor.evidenceScope === 'component-only' ? 'component-fail' : 'behavior-fail';
      return {
        command: display,
        status,
        ...(status === 'failed' ? classifyEvolutionCaseCommandFailure(commandResult, resolved, defaultFailureClass) : {}),
      };
    });
    const status = validations.every(item => item.status === 'passed') ? 'passed' : 'failed';
    const failure = summarizeEvolutionCaseFailures(validations);
    return {
      caseId,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      evidenceScope: descriptor.evidenceScope,
      outcomeEligible: descriptor.evidenceScope === 'deterministic-case' && status === 'passed',
      validations,
      status,
      evidence: descriptor.evidence,
      ...failure,
    };
  });
  const passed = results.filter(item => item.status === 'passed').length;
  const failureClasses = countEvolutionCaseFailureClasses(results);
  return {
    schemaVersion: 3,
    reportType: 'ai-governance-evolution-case-run',
    corpusVersion: corpus.corpusVersion,
    ok: passed === results.length,
    counts: { selected: results.length, passed, failed: results.length - passed, ...failureClasses },
    results,
  };
};
