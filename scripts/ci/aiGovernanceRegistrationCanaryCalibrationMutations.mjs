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
