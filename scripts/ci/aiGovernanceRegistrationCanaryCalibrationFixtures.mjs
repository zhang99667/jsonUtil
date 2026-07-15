import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import {
  buildRegistrationCanaryPacketBundle,
  hashRegistrationCanaryPacketValue,
} from './aiGovernanceRegistrationCanaryPacket.mjs';

const TARGET_CASE_ID = 'mcp-project-registration-discovery';
const EXPERIMENT_ID = 'mcp-project-registration-canary';
const DEFAULT_EXECUTION_ORDER = Object.freeze([
  'mcp-registration-p1-baseline', 'mcp-registration-p1-candidate',
  'mcp-registration-p2-candidate', 'mcp-registration-p2-baseline',
  'mcp-registration-p3-baseline', 'mcp-registration-p3-candidate',
]);
const PACKET_PRIVACY = Object.freeze({
  sourceUserContentStored: false,
  reasoningStored: false,
  toolPayloadStored: false,
  authMaterialStored: false,
  userConfigStored: false,
  absoluteUserPathStored: false,
});
const RESULT_PRIVACY = Object.freeze({
  ...PACKET_PRIVACY,
  responseBodyStored: false,
  traceBodyStored: false,
  armStored: false,
  rubricStored: false,
});

const digest = character => character.repeat(64);
const packetHash = hashRegistrationCanaryPacketValue;
const independentPacketHash = (domain, value) => createHash('sha256')
  .update(JSON.stringify({ domain, value })).digest('hex');
export const registrationCanaryCalibrationOperationId = blindTrialAlias => `op-${independentPacketHash(
  'jsonutils.registration-canary.blind-trace-operation/v1', blindTrialAlias,
).slice(0, 24)}`;
const ledger = (name, character) => ({
  path: `evals/ai-governance/${name}`,
  records: 1,
  headSequence: 1,
  headSha256: digest(character),
  fileSha256: digest(character),
});

export const REGISTRATION_CANARY_CALIBRATION_MUTATIONS = Object.freeze([
  'control-pass',
  'behavior-missing-discovery',
  'infrastructure-timeout',
  'infrastructure-stdout-not-drained',
  'infrastructure-binary-unstable',
  'infrastructure-output-limit',
  'infrastructure-observation-invalid',
  'infrastructure-trace-incomplete',
  'infrastructure-trace-terminal-failed',
  'infrastructure-registry-unavailable',
  'infrastructure-policy-unavailable',
  'infrastructure-adapter-mismatch',
  'infrastructure-forbidden-fallback',
  'near-miss-trace-policy',
  'infrastructure-discovery-unavailable',
  'adversarial-observation-digest',
  'adversarial-caller-verdict',
]);
const EXECUTION_MUTATIONS = Object.freeze({
  'infrastructure-timeout': { terminalStatus: 'interrupted', timedOut: true },
  'infrastructure-stdout-not-drained': { stdoutDrained: false },
  'infrastructure-binary-unstable': { binaryStable: false },
  'infrastructure-output-limit': { outputLimitExceeded: true },
});

export const buildRegistrationCanaryCalibrationFixtureContext = ({
  rootDir,
  executionOrder = DEFAULT_EXECUTION_ORDER,
} = {}) => {
  const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/experiments.json'), 'utf8'));
  const caseItem = corpus.cases.find(item => item.id === TARGET_CASE_ID);
  const experiment = manifest.experiments.find(item => item.id === EXPERIMENT_ID);
  const policies = buildEvolutionTracePolicyRegistry({ rootDir });
  const policyEntry = policies.policiesByCaseId.get(TARGET_CASE_ID);
  if (!caseItem || !experiment || !policyEntry || policies.failures.length > 0) {
    throw new TypeError(`registration calibration fixture 前置非法：${policies.failures.join('；') || 'case/experiment/policy 缺失'}`);
  }
  const fixtureRevision = resolveEvolutionWorktreeRevision(rootDir);
  const bindings = {
    fixtureRevision,
    artifacts: {
      caseDescriptor: { path: 'evals/ai-governance/cases.json', sha256: digest('a') },
      experimentDescriptor: { path: 'evals/ai-governance/experiments.json', sha256: digest('b') },
      projectMcp: { path: '.mcp.json', sha256: digest('c') },
      projectHooks: { path: '.codex/hooks.json', sha256: digest('d') },
    },
    ledgers: {
      outcomes: ledger('outcomes.jsonl', 'e'),
      receipts: ledger('trial-receipts.jsonl', 'f'),
      feedback: ledger('feedback-inbox.jsonl', '1'),
    },
  };
  const environmentSha256 = digest('2');
  const buildPacket = trialId => buildRegistrationCanaryPacketBundle({
    corpusVersion: corpus.corpusVersion,
    manifestVersion: manifest.manifestVersion,
    caseItem,
    experiment,
    trialId,
    runNonce: digest('3'),
    environmentSha256,
    bindings,
  });
  const packetBundles = executionOrder.map(buildPacket);
  const buildTrace = (bundle, { discovered = true } = {}) => {
    const events = [{ sequence: 1, type: 'session.start', actorId: 'root' }];
    if (discovered) {
      const operationId = registrationCanaryCalibrationOperationId(bundle.agent.blindTrialAlias);
      events.push(
        { sequence: 2, type: 'mcp.call', actorId: 'root', operationId, name: 'jsonutils-governance/ai_governance_scorecard', status: 'started', keys: [] },
        { sequence: 3, type: 'mcp.result', actorId: 'root', operationId, name: 'jsonutils-governance/ai_governance_scorecard', status: 'passed', keys: ['maturityScorecard.nextFocus.id'] },
      );
    }
    events.push(
      { sequence: events.length + 1, type: 'response.finish', actorId: 'root', sha256: digest('4'), status: 'passed' },
      { sequence: events.length + 2, type: 'session.finish', actorId: 'root', status: 'passed' },
    );
    return {
      schemaVersion: 1,
      adapter: { id: 'codex-exec-jsonl', version: '1.2.1' },
      capture: {
        status: 'complete', sampling: 'all', droppedEvents: 0,
        droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
      },
      caseSha256: hashEvolutionTraceValue(caseItem),
      policy: structuredClone(policyEntry.descriptor),
      beforeRevision: bundle.host.bindings.fixtureRevision,
      afterRevision: bundle.host.bindings.fixtureRevision,
      events,
    };
  };
  const refreshResultDigests = (result) => {
    result.outputSha256 = result.trace.events.find(event => event.type === 'response.finish').sha256;
    result.bindings.observationSha256 = packetHash('jsonutils.registration-canary.observation/v1', result.observation);
    result.bindings.traceSha256 = packetHash('jsonutils.registration-canary.trace/v1', result.trace);
    return result;
  };
  const buildResult = (bundle, options = {}) => {
    const observation = options.observation ?? {
      registrySurface: 'codex-task-registry',
      serverDiscovery: 'discovered',
      toolDiscovery: 'discovered',
      fallback: 'none',
      infrastructure: 'reported-valid',
    };
    return refreshResultDigests({
      schemaVersion: 1,
      artifactType: 'ai-registration-canary-blind-result',
      dataClass: 'redacted',
      resultVersion: '1.0.0',
      blindTrialAlias: bundle.agent.blindTrialAlias,
      bindings: {
        agentPacketSha256: bundle.host.projectionDigests.agentSha256,
        graderPacketSha256: bundle.host.projectionDigests.graderSha256,
        fixtureRevision: bundle.host.bindings.fixtureRevision,
        environmentSha256: bundle.host.bindings.environmentSha256,
        observationSha256: digest('0'),
        traceSha256: digest('0'),
      },
      execution: {
        terminalStatus: 'completed', exitCode: 0, stdoutDrained: true,
        timedOut: false, binaryStable: true, outputLimitExceeded: false,
        ...(options.execution ?? {}),
      },
      observation,
      outputSha256: digest('0'),
      trace: options.trace ?? buildTrace(bundle),
      claims: {
        executionReported: true, executionVerified: false,
        automaticLedgerWrites: false, outcomeEligible: false,
      },
      privacy: { ...RESULT_PRIVACY },
    });
  };
  return {
    corpus, manifest, caseItem, experiment, policies, policyEntry, fixtureRevision,
    bindings, environmentSha256, packetBundles, buildTrace, refreshResultDigests, buildResult,
    digest, packetHash, packetPrivacy: PACKET_PRIVACY, resultPrivacy: RESULT_PRIVACY,
  };
};

export const buildRegistrationCanaryCalibrationInput = (context, mutation) => {
  const bundle = context.packetBundles[0];
  let policyEntry = context.policyEntry;
  let result;
  if (mutation === 'behavior-missing-discovery') {
    result = context.buildResult(bundle, {
      observation: {
        registrySurface: 'codex-task-registry', serverDiscovery: 'missing',
        toolDiscovery: 'missing', fallback: 'none', infrastructure: 'reported-valid',
      },
      trace: context.buildTrace(bundle, { discovered: false }),
    });
  } else if (EXECUTION_MUTATIONS[mutation]) {
    result = context.buildResult(bundle, { execution: EXECUTION_MUTATIONS[mutation] });
  } else if (mutation === 'near-miss-trace-policy') {
    result = context.buildResult(bundle, { trace: context.buildTrace(bundle, { discovered: false }) });
  } else {
    result = context.buildResult(bundle);
    if (mutation === 'infrastructure-forbidden-fallback') {
      result.observation.fallback = 'shell';
      context.refreshResultDigests(result);
    } else if (mutation === 'infrastructure-discovery-unavailable') {
      result.observation.serverDiscovery = result.observation.toolDiscovery = 'unavailable';
      context.refreshResultDigests(result);
    } else if (mutation === 'infrastructure-observation-invalid') {
      result.observation.infrastructure = 'reported-invalid';
      context.refreshResultDigests(result);
    } else if (mutation === 'infrastructure-trace-incomplete') {
      result.trace.capture.status = 'partial';
      context.refreshResultDigests(result);
    } else if (mutation === 'infrastructure-trace-terminal-failed') {
      result.trace.events.find(event => event.type === 'response.finish').status = 'failed';
      context.refreshResultDigests(result);
    } else if (mutation === 'infrastructure-registry-unavailable') {
      result.observation.registrySurface = 'unavailable';
      result.observation.infrastructure = 'unknown';
      context.refreshResultDigests(result);
    } else if (mutation === 'infrastructure-policy-unavailable') {
      policyEntry = { ...context.policyEntry, verify: null };
    } else if (mutation === 'infrastructure-adapter-mismatch') {
      result.trace.adapter.version = '1.1.0';
      context.refreshResultDigests(result);
    } else if (mutation === 'adversarial-observation-digest') {
      result.observation.serverDiscovery = 'missing';
    } else if (mutation === 'adversarial-caller-verdict') {
      result.verdict = 'pass';
    } else if (mutation !== 'control-pass') {
      throw new TypeError(`未知 registration grader calibration mutation：${mutation}`);
    }
  }
  return {
    resultJson: JSON.stringify(result),
    agentPacket: bundle.agent,
    graderPacket: bundle.grader,
    caseItem: context.caseItem,
    policyEntry,
    expectedFixtureRevision: context.fixtureRevision,
  };
};
