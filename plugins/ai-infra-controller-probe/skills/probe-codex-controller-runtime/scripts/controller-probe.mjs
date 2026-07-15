import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROBE_CONTRACT = Object.freeze({
  id: 'codex-external-controller-runtime-probe',
  version: '1.1.0',
  coverage: 'credential-snapshot-subset',
});
export const PROBE_POLICY = Object.freeze({
  schemaVersion: 1,
  realCodexSpawns: 0,
  modelInvocations: 0,
  credentialMaterialPresent: false,
  automaticLedgerWrites: false,
  retryCount: 0,
  externalNetworkConnections: 0,
  pullPolicy: 'never',
  workloadRoles: ['codex-sentinel', 'mcp-sentinel', 'validation-sentinel'],
});

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const IMAGE_REF_PATTERN = /^.+@sha256:([0-9a-f]{64})$/;
const SENSITIVE_ENV_NAMES = ['CODEX_API_KEY', 'OPENAI_API_KEY'];
// 未有独立审核的固定镜像政策前，真实容器路径必须 fail closed。
const RUNTIME_EXECUTION_ENABLED = false;
const ROLES = PROBE_POLICY.workloadRoles;
const ROLE_UIDS = Object.freeze({
  'codex-sentinel': 11002,
  'mcp-sentinel': 11003,
  'validation-sentinel': 11004,
});
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(SCRIPT_DIR, '..');
const PLUGIN_ROOT = path.resolve(SKILL_ROOT, '../..');
const LAUNCHER_FILE = path.join(SCRIPT_DIR, 'run-controller-probe.mjs');
const LEDGER_PATHS = [
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
];
const VALUE_FLAGS = new Set([
  '--docker-binary', '--docker-host', '--image-ref', '--image-sha256',
  '--snapshot-sha256', '--topology-plan-sha256', '--trial-nonce-sha256',
  '--output', '--snapshot',
]);

const sha256 = value => createHash('sha256').update(value).digest('hex');
const hashNamespace = (kind, value) => sha256(`ai-infra-controller-probe/${kind}/v1\0${value}`);
const isWithin = (parent, candidate) => {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};
const assertSha256 = (value, label) => {
  if (!SHA256_PATTERN.test(value ?? '')) throw new TypeError(`${label} 必须是小写 SHA-256`);
};
const assertRegularFile = (file, label) => {
  if (!path.isAbsolute(file)) throw new TypeError(`${label} 必须是绝对路径`);
  const stat = fs.lstatSync(file);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new TypeError(`${label} 必须是非符号链接普通文件`);
};
const hashFile = file => sha256(fs.readFileSync(file));

export const hashDirectory = (root) => {
  const rootStat = fs.lstatSync(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new TypeError('目录摘要根必须是普通目录');
  const manifest = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new TypeError(`目录摘要拒绝符号链接: ${relative}`);
      if (stat.isDirectory()) visit(absolute);
      else if (stat.isFile()) manifest.push({ path: relative, executable: Boolean(stat.mode & 0o111), sha256: hashFile(absolute) });
      else throw new TypeError(`目录摘要拒绝特殊文件: ${relative}`);
    }
  };
  visit(root);
  return sha256(JSON.stringify(manifest));
};

export const parseControllerProbeArgs = (argv) => {
  const values = {};
  let run = false;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--run') {
      if (run) throw new TypeError('参数 --run 不得重复');
      run = true;
      continue;
    }
    if (!VALUE_FLAGS.has(flag)) throw new TypeError(`不支持的参数: ${flag}`);
    if (Object.hasOwn(values, flag)) throw new TypeError(`参数不得重复: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new TypeError(`参数缺少值: ${flag}`);
    values[flag] = value;
    index += 1;
  }
  const required = [...VALUE_FLAGS].filter(flag => flag !== '--snapshot');
  for (const flag of required) if (!values[flag]) throw new TypeError(`缺少参数: ${flag}`);
  if (run && !values['--snapshot']) throw new TypeError('--run 必须提供 --snapshot');
  for (const flag of ['--image-sha256', '--snapshot-sha256', '--topology-plan-sha256', '--trial-nonce-sha256']) {
    assertSha256(values[flag], flag);
  }
  const imageMatch = values['--image-ref'].match(IMAGE_REF_PATTERN);
  if (!imageMatch || imageMatch[1] !== values['--image-sha256']) {
    throw new TypeError('--image-ref 必须按 digest 固定并匹配 --image-sha256');
  }
  if (!/^unix:\/\/\/.+/.test(values['--docker-host'])) throw new TypeError('--docker-host 只允许绝对 Unix socket');
  for (const flag of ['--docker-binary', '--output']) {
    if (!path.isAbsolute(values[flag])) throw new TypeError(`${flag} 必须是绝对路径`);
  }
  if (values['--snapshot'] && !path.isAbsolute(values['--snapshot'])) throw new TypeError('--snapshot 必须是绝对路径');
  return Object.freeze({
    run,
    dockerBinary: values['--docker-binary'],
    dockerHost: values['--docker-host'],
    imageRef: values['--image-ref'],
    imageSha256: values['--image-sha256'],
    snapshotSha256: values['--snapshot-sha256'],
    topologyPlanSha256: values['--topology-plan-sha256'],
    trialNonceSha256: values['--trial-nonce-sha256'],
    output: values['--output'],
    snapshot: values['--snapshot'] ?? null,
  });
};

const defaultExecFile = (file, args, options) => new Promise((resolve) => {
  execFile(file, args, options, (error, stdout, stderr) => resolve({
    status: error ? (Number.isInteger(error.code) ? error.code : 1) : 0,
    stdout: String(stdout ?? ''),
    stderr: String(stderr ?? ''),
  }));
});
const dockerArgs = (dockerHost, args) => ['--host', dockerHost, ...args];
const safeDockerCall = (execFileFn, options, args, timeout = 15_000) => execFileFn(
  options.dockerBinary,
  dockerArgs(options.dockerHost, args),
  { env: options.dockerEnv, timeout, maxBuffer: 1024 * 1024 },
);
const safeClientCall = (execFileFn, options, args) => execFileFn(
  options.dockerBinary,
  args,
  { env: options.dockerEnv, timeout: 10_000, maxBuffer: 256 * 1024 },
);

const buildBindings = (options) => ({
  topologyPlanSha256: options.topologyPlanSha256,
  controllerBundleSha256: hashDirectory(PLUGIN_ROOT),
  launcherBundleSha256: hashFile(LAUNCHER_FILE),
  policySha256: sha256(JSON.stringify(PROBE_POLICY)),
  snapshotSha256: options.snapshotSha256,
  trialNonceSha256: options.trialNonceSha256,
  runtimeBinarySha256: hashFile(options.dockerBinary),
  workloadImages: Object.fromEntries(ROLES.map(role => [role, options.imageSha256])),
});
const emptyWorkload = (role, imageSha256) => ({
  role,
  attempted: false,
  imageSha256,
  uid: ROLE_UIDS[role],
  pidNamespaceSha256: null,
  userNamespaceSha256: null,
  ipcNamespaceSha256: null,
  mountNamespaceSha256: null,
  networkNamespaceSha256: null,
  authenticationRoot: 'empty',
  snapshotAccess: role === 'codex-sentinel' ? 'absent' : 'read-only',
  foreignCanaryAccess: 'not-run',
  privileged: null,
  noNewPrivileges: null,
  readOnlyRootFs: null,
  hostPid: null,
  hostNetwork: null,
  dockerSocket: null,
  hostProc: null,
  capabilities: null,
});
const buildReport = ({ bindings, runtime, attempted, workloads, snapshot, failures, cleanupComplete }) => ({
  schemaVersion: 1,
  reportType: 'codex-fake-sentinel-runtime-probe',
  contract: {
    id: PROBE_CONTRACT.id,
    version: PROBE_CONTRACT.version,
    evidenceScope: 'component-only',
    coverage: PROBE_CONTRACT.coverage,
    producer: 'project-plugin-installed-copy-unverified',
  },
  bindings,
  execution: {
    origin: 'project-plugin-installed-copy-unverified',
    runtimeAttempted: attempted,
    realCodexSpawns: 0,
    modelInvocations: 0,
    credentialMaterialPresent: false,
    candidateGenerated: false,
    automaticLedgerWrites: false,
    retryCount: 0,
    externalNetworkConnections: 0,
    cleanupComplete,
  },
  runtime: {
    kind: 'docker',
    clientAvailable: runtime.clientAvailable,
    serverAvailable: runtime.serverAvailable,
    imagePresent: runtime.imagePresent,
    pullPolicy: 'never',
    eciStatus: 'unverified',
    evidenceOrigin: 'self-reported-unverified',
  },
  workloads,
  snapshot,
  result: {
    status: attempted ? (failures.length === 0 ? 'passed-subset' : 'rejected') : 'not-run',
    runtimeProbeObserved: attempted && failures.length === 0,
    runtimeIsolationVerified: false,
    controllerIsolationVerified: false,
    userNamespaceVerified: false,
    signerVerified: false,
    trustedSigners: 0,
    topologyComplete: false,
    outcomeEligible: false,
    confirmedCoverageEligible: false,
    failures,
  },
});

const assertOutputBoundary = (options) => {
  const outputParent = path.dirname(options.output);
  if (!fs.statSync(outputParent).isDirectory()) throw new TypeError('--output 父目录不存在');
  if (fs.existsSync(options.output)) throw new TypeError('--output 必须指向不存在的新文件');
  const canonicalOutput = path.join(fs.realpathSync(outputParent), path.basename(options.output));
  const canonicalPlugin = fs.realpathSync(PLUGIN_ROOT);
  const canonicalSnapshot = options.snapshot && fs.existsSync(options.snapshot)
    ? fs.realpathSync(options.snapshot)
    : null;
  if (isWithin(canonicalPlugin, canonicalOutput)
    || (canonicalSnapshot && isWithin(canonicalSnapshot, canonicalOutput))) {
    throw new TypeError('--output 必须位于插件和 snapshot 外');
  }
};
const assertSealedSnapshot = (options) => {
  const stat = fs.lstatSync(options.snapshot);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new TypeError('--snapshot 必须是普通目录');
  const canonicalSnapshot = fs.realpathSync(options.snapshot);
  const canonicalPlugin = fs.realpathSync(PLUGIN_ROOT);
  if (isWithin(canonicalPlugin, canonicalSnapshot) || isWithin(canonicalSnapshot, canonicalPlugin)) {
    throw new TypeError('--snapshot 必须与插件目录隔离');
  }
  for (let current = canonicalSnapshot; ; current = path.dirname(current)) {
    if (fs.existsSync(path.join(current, '.git'))) throw new TypeError('--snapshot 不得位于 live checkout');
    if (path.dirname(current) === current) break;
  }
  for (const ledger of LEDGER_PATHS) {
    if (fs.existsSync(path.join(canonicalSnapshot, ledger))) throw new TypeError('--snapshot 不得包含 outcome ledger');
  }
  if (hashDirectory(canonicalSnapshot) !== options.snapshotSha256) throw new TypeError('--snapshot 摘要与 host binding 不匹配');
};
const writeReport = (output, report) => {
  const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW;
  const handle = fs.openSync(output, flags, 0o600);
  try {
    fs.fchmodSync(handle, 0o600);
    fs.writeFileSync(handle, JSON.stringify(report), 'utf8');
  } finally { fs.closeSync(handle); }
};

const execInContainer = (execFileFn, options, container, command) => safeDockerCall(
  execFileFn,
  options,
  ['exec', container, 'sh', '-ceu', command],
);
const namespaceDigest = async (execFileFn, options, container, namespace) => {
  const result = await execInContainer(execFileFn, options, container, `readlink /proc/self/ns/${namespace}`);
  return result.status === 0 ? hashNamespace(`namespace-${namespace}`, result.stdout.trim()) : null;
};

const collectWorkload = async (execFileFn, options, role, container) => {
  const inspectResult = await safeDockerCall(execFileFn, options, ['inspect', container]);
  if (inspectResult.status !== 0) return { workload: emptyWorkload(role, options.imageSha256), failures: [`${role}-inspect-failed`] };
  let inspected;
  try { [inspected] = JSON.parse(inspectResult.stdout); } catch {
    return { workload: emptyWorkload(role, options.imageSha256), failures: [`${role}-inspect-invalid`] };
  }
  const host = inspected?.HostConfig ?? {};
  const mounts = Array.isArray(inspected?.Mounts) ? inspected.Mounts : [];
  const securityOptions = Array.isArray(host.SecurityOpt) ? host.SecurityOpt : [];
  const snapshotMount = mounts.find(mount => mount.Destination === '/snapshot');
  const uidResult = await execInContainer(execFileFn, options, container, 'id -u');
  const noNewPrivilegesResult = await execInContainer(execFileFn, options, container, "awk '/^NoNewPrivs:/ {print $2}' /proc/self/status");
  const capabilityResult = await execInContainer(execFileFn, options, container, "awk '/^CapEff:/ {print $2}' /proc/self/status");
  const authResult = await execInContainer(execFileFn, options, container, 'test ! -e /tmp/home/auth.json && test ! -e /tmp/home/.codex && test ! -e /tmp/home/codex && test ! -e /tmp/home/codex/auth.json');
  const canaryCommand = role === 'codex-sentinel'
    ? 'test -f /canary/private && test ! -e /canary/foreign'
    : 'test ! -e /canary/private && test ! -e /canary/foreign';
  const canaryResult = await execInContainer(execFileFn, options, container, canaryCommand);
  const rootWriteResult = await execInContainer(execFileFn, options, container, 'if touch /probe-root-write 2>/dev/null; then exit 1; fi');
  const socketResult = await execInContainer(execFileFn, options, container, 'test ! -S /var/run/docker.sock');
  const snapshotWriteResult = role === 'codex-sentinel'
    ? await execInContainer(execFileFn, options, container, 'test ! -e /snapshot')
    : await execInContainer(execFileFn, options, container, 'test -d /snapshot && if touch /snapshot/.probe-write 2>/dev/null; then exit 1; fi');
  const failures = [];
  if (Number(uidResult.stdout.trim()) !== ROLE_UIDS[role]) failures.push(`${role}-uid-mismatch`);
  if (noNewPrivilegesResult.stdout.trim() !== '1') failures.push(`${role}-no-new-privileges-missing`);
  if (!/^0+$/.test(capabilityResult.stdout.trim())) failures.push(`${role}-capability-observed`);
  if ([authResult, canaryResult, rootWriteResult, socketResult, snapshotWriteResult].some(result => result.status !== 0)) {
    failures.push(`${role}-boundary-check-failed`);
  }
  const capDrop = Array.isArray(host.CapDrop) ? host.CapDrop.map(value => String(value).toUpperCase()) : [];
  const effectiveCapabilitiesEmpty = /^0+$/.test(capabilityResult.stdout.trim()) && capDrop.includes('ALL');
  const workload = {
      role,
      attempted: true,
      imageSha256: options.imageSha256,
      uid: Number(uidResult.stdout.trim()),
      pidNamespaceSha256: await namespaceDigest(execFileFn, options, container, 'pid'),
      userNamespaceSha256: await namespaceDigest(execFileFn, options, container, 'user'),
      ipcNamespaceSha256: await namespaceDigest(execFileFn, options, container, 'ipc'),
      mountNamespaceSha256: await namespaceDigest(execFileFn, options, container, 'mnt'),
      networkNamespaceSha256: await namespaceDigest(execFileFn, options, container, 'net'),
      authenticationRoot: authResult.status === 0 ? 'empty' : 'non-empty',
      snapshotAccess: snapshotMount ? (snapshotMount.RW === false ? 'read-only' : 'read-write') : 'absent',
      foreignCanaryAccess: canaryResult.status === 0 ? 'denied' : 'allowed',
      privileged: Boolean(host.Privileged),
      noNewPrivileges: securityOptions.some(value => String(value).startsWith('no-new-privileges')),
      readOnlyRootFs: Boolean(host.ReadonlyRootfs),
      hostPid: host.PidMode === 'host',
      hostNetwork: host.NetworkMode === 'host',
      dockerSocket: mounts.some(mount => mount.Destination === '/var/run/docker.sock'),
      hostProc: mounts.some(mount => mount.Destination === '/proc' && mount.Source === '/proc'),
      capabilities: effectiveCapabilitiesEmpty ? [] : ['effective-capability-observed'],
  };
  const expectedSnapshotAccess = role === 'codex-sentinel' ? 'absent' : 'read-only';
  if (workload.privileged || !workload.noNewPrivileges || !workload.readOnlyRootFs
    || workload.hostPid || workload.hostNetwork || workload.dockerSocket || workload.hostProc
    || workload.capabilities.length !== 0 || workload.authenticationRoot !== 'empty'
    || workload.snapshotAccess !== expectedSnapshotAccess || workload.foreignCanaryAccess !== 'denied') {
    failures.push(`${role}-unsafe-runtime-observed`);
  }
  return { workload, failures };
};

const runSubset = async (execFileFn, options) => {
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-infra-controller-runtime-'));
  fs.chmodSync(runtimeDir, 0o700);
  const canaryFile = path.join(runtimeDir, 'synthetic-canary');
  fs.writeFileSync(canaryFile, 'synthetic-only\n', { mode: 0o600 });
  const label = `ai-infra-controller-probe=${options.trialNonceSha256.slice(0, 20)}`;
  const containers = [];
  const failures = [];
  let cleanupComplete = true;
  try {
    for (const role of ROLES) {
      const name = `ai-probe-${options.trialNonceSha256.slice(0, 10)}-${role}`;
      const createArgs = [
        'create', '--name', name, '--label', label, '--pull', 'never', '--read-only',
        '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true', '--network', 'none',
        '--ipc', 'private', '--user', `${ROLE_UIDS[role]}:${ROLE_UIDS[role]}`,
        '--env', 'HOME=/tmp/home', '--env', 'CODEX_HOME=/tmp/home/codex',
        '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=4m',
      ];
      if (role === 'codex-sentinel') {
        createArgs.push('--mount', `type=bind,src=${canaryFile},dst=/canary/private,readonly`);
      } else {
        createArgs.push('--mount', `type=bind,src=${options.snapshot},dst=/snapshot,readonly`);
      }
      createArgs.push(options.imageRef, 'sh', '-ceu', 'while :; do sleep 60; done');
      const created = await safeDockerCall(execFileFn, options, createArgs, 30_000);
      if (created.status !== 0) {
        failures.push(`${role}-create-failed`);
        break;
      }
      containers.push({ role, name });
    }
    for (const container of containers) {
      const started = await safeDockerCall(execFileFn, options, ['start', container.name], 30_000);
      if (started.status !== 0) failures.push(`${container.role}-start-failed`);
    }
    const collected = [];
    for (const container of containers) {
      const item = await collectWorkload(execFileFn, options, container.role, container.name);
      collected.push(item.workload);
      failures.push(...item.failures);
    }
    const workloads = ROLES.map(role => collected.find(item => item.role === role) ?? emptyWorkload(role, options.imageSha256));
    for (const field of ['pidNamespaceSha256', 'ipcNamespaceSha256', 'mountNamespaceSha256', 'networkNamespaceSha256']) {
      const values = workloads.map(workload => workload[field]);
      if (!values.every(value => SHA256_PATTERN.test(value ?? '')) || new Set(values).size !== values.length) {
        failures.push(`${field}-not-isolated`);
      }
    }
    return { workloads, failures, cleanup: () => ({ cleanupComplete }) };
  } finally {
    for (const container of containers.reverse()) {
      const removed = await safeDockerCall(execFileFn, options, ['rm', '--force', '--volumes', container.name], 20_000);
      if (removed.status !== 0) cleanupComplete = false;
    }
    const remaining = await safeDockerCall(execFileFn, options, ['ps', '-a', '--filter', `label=${label}`, '--format', '{{.ID}}']);
    if (remaining.status !== 0 || remaining.stdout.trim() !== '') cleanupComplete = false;
    fs.rmSync(runtimeDir, { recursive: true, force: true });
  }
};

export const runControllerProbe = async ({
  argv,
  env = process.env,
  execFileFn = defaultExecFile,
} = {}) => {
  for (const name of SENSITIVE_ENV_NAMES) {
    if (Object.hasOwn(env, name)) throw new Error(`拒绝携带敏感环境变量: ${name}`);
  }
  const options = parseControllerProbeArgs(argv ?? []);
  assertRegularFile(options.dockerBinary, '--docker-binary');
  assertOutputBoundary(options);
  if (options.run) assertSealedSnapshot(options);
  const dockerHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-infra-controller-docker-'));
  fs.chmodSync(dockerHome, 0o700);
  const dockerOptions = {
    ...options,
    dockerEnv: { HOME: dockerHome, DOCKER_CONFIG: dockerHome, PATH: '/usr/bin:/bin:/usr/sbin:/sbin' },
  };
  try {
    const clientResult = await safeClientCall(execFileFn, dockerOptions, ['--version']);
    const serverResult = clientResult.status === 0
      ? await safeDockerCall(execFileFn, dockerOptions, ['version', '--format', '{{.Server.Version}}'])
      : { status: 1 };
    const imageResult = serverResult.status === 0
      ? await safeDockerCall(execFileFn, dockerOptions, ['image', 'inspect', options.imageRef, '--format', '{{.Id}}'])
      : { status: 1 };
    const runtime = {
      clientAvailable: clientResult.status === 0,
      serverAvailable: serverResult.status === 0,
      imagePresent: imageResult.status === 0,
    };
    const bindings = buildBindings(options);
    const emptySnapshot = {
      mountedRoles: [],
      digestBefore: options.snapshotSha256,
      digestAfter: options.snapshotSha256,
      writeAttemptsDenied: null,
      liveCheckoutMounted: false,
      ledgerFilesPresent: false,
    };
    if (!options.run || !runtime.serverAvailable || !runtime.imagePresent || !RUNTIME_EXECUTION_ENABLED) {
      const failure = !runtime.serverAvailable
        ? 'docker-server-unavailable'
        : (!runtime.imagePresent
          ? 'pinned-image-unavailable'
          : (options.run ? 'runtime-execution-disabled' : 'runtime-not-requested'));
      const report = buildReport({
        bindings,
        runtime,
        attempted: false,
        workloads: ROLES.map(role => emptyWorkload(role, options.imageSha256)),
        snapshot: emptySnapshot,
        failures: [failure],
        cleanupComplete: true,
      });
      writeReport(options.output, report);
      return { report, outputPath: options.output, exitCode: 2 };
    }
    const snapshotBefore = hashDirectory(options.snapshot);
    const subset = await runSubset(execFileFn, dockerOptions);
    const snapshotAfter = hashDirectory(options.snapshot);
    if (snapshotBefore !== snapshotAfter) subset.failures.push('snapshot-digest-changed');
    const cleanupComplete = subset.cleanup().cleanupComplete;
    if (!cleanupComplete) subset.failures.push('cleanup-incomplete');
    const report = buildReport({
      bindings,
      runtime,
      attempted: true,
      workloads: subset.workloads,
      snapshot: {
        mountedRoles: ['mcp-sentinel', 'validation-sentinel'],
        digestBefore: snapshotBefore,
        digestAfter: snapshotAfter,
        writeAttemptsDenied: subset.failures.every(item => !item.endsWith('boundary-check-failed')),
        liveCheckoutMounted: false,
        ledgerFilesPresent: false,
      },
      failures: [...new Set(subset.failures)],
      cleanupComplete,
    });
    writeReport(options.output, report);
    return { report, outputPath: options.output, exitCode: report.result.status === 'passed-subset' ? 0 : 1 };
  } finally {
    fs.rmSync(dockerHome, { recursive: true, force: true });
  }
};
