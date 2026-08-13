import { createHash } from 'node:crypto';
import {
  CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE,
  RUNTIME_PROBE_SNAPSHOT_ROLES,
  isRuntimeProbeSha256,
  parseCodexExternalControllerRuntimeProbeReport,
} from './aiGovernanceCodexExternalControllerRuntimeProbeContract.mjs';

export { CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE } from './aiGovernanceCodexExternalControllerRuntimeProbeContract.mjs';

const unique = values => new Set(values).size === values.length;

const observedNamespaceValues = (workloads, field) => workloads.map(workload => workload[field]);
const hasUnobservedWorkloadFields = workload => [
  workload.pidNamespaceSha256, workload.userNamespaceSha256, workload.ipcNamespaceSha256,
  workload.mountNamespaceSha256, workload.networkNamespaceSha256, workload.privileged,
  workload.noNewPrivileges, workload.readOnlyRootFs, workload.hostPid, workload.hostNetwork,
  workload.dockerSocket, workload.hostProc, workload.capabilities,
].every(value => value === null);

export const verifyCodexExternalControllerRuntimeProbeReport = ({ reportJson, expectedBindings }) => {
  const report = parseCodexExternalControllerRuntimeProbeReport({ reportJson, expectedBindings });
  const { contract, execution, runtime, workloads, snapshot, result } = report;
  const failures = [];
  if (report.schemaVersion !== 1 || report.reportType !== 'codex-fake-sentinel-runtime-probe'
    || contract.id !== CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.id
    || contract.version !== CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.version
    || contract.evidenceScope !== 'component-only'
    || contract.coverage !== CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.coverage
    || contract.producer !== 'project-plugin-installed-copy-unverified') failures.push('contract-boundary-invalid');
  if (execution.origin !== 'project-plugin-installed-copy-unverified' || execution.realCodexSpawns !== 0
    || execution.modelInvocations !== 0 || execution.credentialMaterialPresent !== false
    || execution.candidateGenerated !== false || execution.automaticLedgerWrites !== false
    || execution.retryCount !== 0 || execution.externalNetworkConnections !== 0) {
    failures.push('execution-boundary-invalid');
  }
  if (runtime.kind !== 'docker' || runtime.pullPolicy !== 'never'
    || runtime.evidenceOrigin !== 'self-reported-unverified'
    || runtime.eciStatus !== 'unverified'
    || ![runtime.clientAvailable, runtime.serverAvailable, runtime.imagePresent]
      .every(value => typeof value === 'boolean')) failures.push('runtime-boundary-invalid');
  if (!unique(workloads.map(workload => workload.uid))) failures.push('uid-not-isolated');
  const attempted = execution.runtimeAttempted === true;
  if (attempted) {
    if (!runtime.clientAvailable || !runtime.serverAvailable || !runtime.imagePresent
      || !workloads.every(workload => workload.attempted === true)) failures.push('runtime-observation-incomplete');
    for (const field of ['pidNamespaceSha256', 'ipcNamespaceSha256', 'mountNamespaceSha256', 'networkNamespaceSha256']) {
      const values = observedNamespaceValues(workloads, field);
      if (!values.every(isRuntimeProbeSha256) || !unique(values)) {
        failures.push('namespace-not-isolated');
      }
    }
  } else if (execution.runtimeAttempted !== false
    || workloads.some(workload => workload.attempted !== false || !hasUnobservedWorkloadFields(workload))) {
    failures.push('runtime-observation-invalid');
  }
  workloads.forEach((workload) => {
    const expectsSnapshot = RUNTIME_PROBE_SNAPSHOT_ROLES.includes(workload.role);
    if (workload.authenticationRoot !== 'empty'
      || workload.snapshotAccess !== (expectsSnapshot ? 'read-only' : 'absent')
      || workload.foreignCanaryAccess !== (attempted ? 'denied' : 'not-run')) {
      failures.push('workload-boundary-invalid');
    }
    if (attempted && (workload.privileged !== false || workload.noNewPrivileges !== true
      || workload.readOnlyRootFs !== true || workload.hostPid !== false
      || workload.hostNetwork !== false || workload.dockerSocket !== false
      || workload.hostProc !== false || !Array.isArray(workload.capabilities)
      || workload.capabilities.length !== 0)) failures.push('unsafe-runtime-capability');
  });
  const expectedMountedRoles = attempted ? RUNTIME_PROBE_SNAPSHOT_ROLES : [];
  if (JSON.stringify(snapshot.mountedRoles) !== JSON.stringify(expectedMountedRoles)
    || snapshot.digestBefore !== report.bindings.snapshotSha256
    || snapshot.digestAfter !== report.bindings.snapshotSha256
    || snapshot.writeAttemptsDenied !== (attempted ? true : null)
    || snapshot.liveCheckoutMounted !== false || snapshot.ledgerFilesPresent !== false) {
    failures.push('snapshot-boundary-invalid');
  }
  if (execution.cleanupComplete !== true) failures.push('cleanup-incomplete');
  if (result.runtimeIsolationVerified !== false || result.controllerIsolationVerified !== false
    || result.userNamespaceVerified !== false || result.signerVerified !== false
    || result.trustedSigners !== 0 || result.topologyComplete !== false
    || result.outcomeEligible !== false || result.confirmedCoverageEligible !== false) {
    failures.push('claim-boundary-invalid');
  }
  const expectedStatus = attempted ? 'passed-subset' : 'not-run';
  if (result.status !== expectedStatus || result.runtimeProbeObserved !== attempted
    || attempted !== workloads.every(workload => workload.attempted)
    || (attempted ? result.failures.length !== 0 : result.failures.length === 0)) {
    failures.push('status-claim-invalid');
  }
  const uniqueFailures = [...new Set(failures)];
  return Object.freeze({
    schemaVersion: 1,
    reportType: 'codex-external-controller-runtime-probe-verification',
    probe: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE,
    ok: uniqueFailures.length === 0,
    verificationStatus: uniqueFailures.length > 0
      ? 'rejected'
      : (attempted ? 'component-subset-observed' : 'runtime-not-observed'),
    evidenceScope: 'component-only',
    coverage: CODEX_EXTERNAL_CONTROLLER_RUNTIME_PROBE.coverage,
    captureOrigin: 'personal-plugin-self-report-unverified',
    runtimeProbeObserved: uniqueFailures.length === 0 && attempted,
    runtimeIsolationVerified: false,
    controllerIsolationVerified: false,
    userNamespaceVerified: false,
    signerVerified: false,
    trustedSigners: 0,
    outcomeEligible: false,
    confirmedCoverageEligible: false,
    modelInvoked: false,
    credentialMaterialObserved: false,
    automaticLedgerWrites: false,
    reportSha256: createHash('sha256').update(reportJson).digest('hex'),
    failures: uniqueFailures,
  });
};
