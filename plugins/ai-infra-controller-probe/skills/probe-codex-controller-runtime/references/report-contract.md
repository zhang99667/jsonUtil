# Controller probe report contracts

Read this reference before running a probe or interpreting a report.

## Contents

- [Shared trust boundary](#shared-trust-boundary)
- [macOS Seatbelt sentinel](#macos-seatbelt-sentinel)
- [Seatbelt closed report](#seatbelt-closed-report)
- [Seatbelt observation semantics](#seatbelt-observation-semantics)
- [Docker preflight](#docker-preflight)
- [Fixed negative claims](#fixed-negative-claims)

## Shared trust boundary

Both producers are `project-plugin-installed-copy-unverified`. Their reports are component evidence, not
attestations. A plugin bundle digest binds bytes but does not prove an external identity, protected
time, non-equivocation, controller isolation, or signer isolation.

Never include credentials, environment values, absolute paths, canary bytes, commands, stdout,
stderr, prompts, transcripts, PIDs, or model output in either report. Keep every report outside the
plugin, snapshot, and live checkout. Its canonical parent must be owned by the current UID with mode
`0700` and no ACL; create the report as a new `0600` inode, `fsync` it, and recheck parent/inode/ACL
identity. The bounded CLI summary includes the report SHA-256.

## macOS Seatbelt sentinel

Plugin 0.5.0 runs a real Darwin `/usr/bin/sandbox-exec` sentinel. It executes only synthetic Node
workloads and two Codex capability probes:

- `<codex-binary> --version`;
- `<codex-binary> sandbox --help`.

Before either call, verify the canonical regular Codex binary with fixed Apple `codesign` policy:
strict on-disk/designated-requirement verification, identifier `codex`, Developer ID
`TeamIdentifier=2DC432GLL2`, hardened-runtime flag, and the exact designated requirement. Bind the
canonical identity fields and full SHA-256 CDHash as `codexCodeIdentitySha256`. Reject a binary under
the plugin, live checkout, source snapshot, output parent, or `/private/tmp`.

Only after every static caller binding matches may the producer create its fixed-`/private/tmp`
temporary root and execute Codex. Both calls run inside the explicit `codexCapability` Seatbelt
profile with empty read-only `HOME` and `CODEX_HOME`; no `codex exec`, model, API, user configuration,
saved authentication, or task registry is requested. Stderr is discarded and never enters the
report. The help stdout is represented only by its caller-expected SHA-256.

The stable policy template contains separate `readAllow`, `readDeny`, `writeDeny`, `networkDeny`,
`processInfoDeny`, and `codexCapability` profiles. `policySha256` hashes this closed template with a
literal path placeholder. Reject quote, backslash, C0, or DEL in every path before creating any
temporary directory. Runtime secret/live paths are canonicalized with `realpath` and then safely
substituted; random paths therefore do not make the expected policy binding unstable.

The real sealed snapshot is never passed to chmod, create, write, or unlink—not even as a negative
probe. Source mutation is fixed false, and a metadata-sensitive source digest plus manifest/tree/
revision bindings are verified before and after. Baseline chmod/write and exact `EXIT_DENIED`
Seatbelt negatives run only against a disposable manifest mirror beneath the owned temporary root.
Ledger copies may be either present or absent; `ledgerCopiesPresent` is informational and never a
snapshot-integrity prerequisite.

## Seatbelt closed report

The top-level object has exactly these keys, in this order:

```text
schemaVersion, reportType, contract, bindings, execution, observations, claims, result
```

`schemaVersion` is `2`. `reportType` is
`codex-external-controller-seatbelt-sentinel`.

### contract

The exact object is:

```json
{
  "id": "codex-external-controller-seatbelt-sentinel-execution",
  "version": "2.2.0",
  "evidenceScope": "component-only",
  "coverage": "macos-seatbelt-policy-subset",
  "producer": "project-plugin-installed-copy-unverified"
}
```

### bindings

The exact keys are:

```text
snapshotRevision, snapshotManifestSha256, snapshotTreeSha256,
controllerBundleSha256, childBundleSha256, nodeRuntimeSha256,
launcherBundleSha256, policySha256, trialNonceSha256,
sandboxBinarySha256, codexBinarySha256, codexCodeIdentitySha256,
codexVersion, codexSandboxHelpSha256
```

Every digest is a 64-character lowercase SHA-256. `snapshotRevision` is
`worktree-<sha256>`. `codexVersion` is a single bounded printable version string.
The accepted sealed manifest is `2.0.0` with revision profile
`jsonutils-evolution-source-state-v2`: revision binds non-ledger path/mode/raw bytes but not HEAD;
HEAD remains separately sealed audit metadata.

The caller must supply expected controller, child, Node runtime, launcher, policy, sandbox, Codex
bytes/code identity, snapshot, nonce, version, and help bindings. The producer recomputes every
static value before Codex runs, then recomputes controller/child/Node/launcher/policy/sandbox/Codex
bytes/code identity and snapshot bindings after the probes. `collectSeatbeltSentinelStaticExpectations` and
`collectCodexPreflightExpectations` are local candidate generators, not an independent trust root.

### execution

The exact keys are:

```text
origin, platform, architecture, sandboxMechanism, sandboxCommandObserved,
realCodexAgentSpawns, modelInvocationRequested, credentialMaterialRequested,
candidateGenerated, automaticLedgerWrites, retryCount
```

Fixed values are:

- `origin="project-plugin-installed-copy-unverified"`;
- `platform="darwin"`;
- `sandboxMechanism="seatbelt-direct"`;
- `realCodexAgentSpawns=0`;
- `modelInvocationRequested=false`;
- `credentialMaterialRequested=false`;
- `candidateGenerated=false`;
- `automaticLedgerWrites=false`;
- `retryCount=0`.

`sandboxCommandObserved` is true after at least one direct Seatbelt command returns. It does not
imply the complete subset passed.

### observations

The exact nested objects are:

```text
codexPreflight(staticBindingsMatched, codeIdentityMatched, versionMatched,
               sandboxHelpMatched, seatbeltProfileObserved, postflightBindingsMatched)
syntheticSecret(baselineReadObserved, sandboxReadDenied, canarySha256)
liveCheckout(baselineReadObserved, sandboxReadDenied)
snapshot(sourceMutationAttempted, sourceDigestBefore, sourceDigestAfter,
         manifestReadObserved, manifestReadSha256, ledgerCopiesPresent,
         disposableMirrorBaselineChmodObserved, disposableMirrorBaselineWriteObserved,
         disposableMirrorChmodDenied, disposableMirrorWriteDenied,
         disposableMirrorDigestBefore, disposableMirrorDigestAfter)
network(loopbackBaselineConnected, sandboxLoopbackDenied)
processInfo(siblingBaselineVisible, sandboxSiblingInfoDenied, sameUidObserved)
cleanup(childrenExited, tempEntriesRemoved, residualNonceObjects)
```

Observation fields are booleans except the SHA-256 or nullable SHA-256 fields and the non-negative
integer `residualNonceObjects`. `canarySha256` is a one-way digest of random synthetic bytes and may
be null before temporary state exists. Source, manifest, and mirror digests may be null in an early
rejection. `sourceMutationAttempted` is always false. Ledger copies are allowed true or false and
reported read-only; their presence is not an integrity requirement, outcome, or signer claim.

Every baseline/control boolean means both the pre-denial and post-denial control succeeded against
the same still-usable target or service. A deny boolean may be true only when those controls pass and
the fixed helper returns `EXIT_DENIED=73` for an underlying `EPERM`. `EACCES`, `EROFS`, timeout,
connection refusal, missing process target, ordinary `ps` failure, helper mismatch, or malformed
profile is never classified as a policy denial.

### claims

The exact keys are:

```text
seatbeltPolicyObserved, snapshotIntegrityObserved, syntheticSecretPolicyObserved,
networkPolicyObserved, processInfoPolicyObserved, boundedCleanupObserved,
secretIsolationVerified, immutableMountVerified, pidNamespaceVerified,
userNamespaceVerified, controllerIsolationVerified, signerIsolationVerified,
trustedSigners, modelInvocationAbsenceVerified, currentTaskRegistryVerified,
topologyComplete, outcomeEligible, confirmedCoverageEligible
```

Only the first six claims may become true, and only when derived from their complete corresponding
observations. All remaining booleans are fixed false and `trustedSigners` is fixed `0`.
`modelInvocationRequested=false` does not establish `modelInvocationAbsenceVerified`.

### result

The exact keys are:

```text
status, runtimeSubsetExecutionObserved, failures
```

`status` is `passed-subset` or `rejected`. `runtimeSubsetExecutionObserved` mirrors direct Seatbelt
execution, so an honest partial `rejected` report may retain true observations and true derived
subset claims. `failures` is a unique array of bounded lowercase safe IDs. A caller must not erase
partial evidence or convert an infrastructure rejection into an Agent behavior failure.

The producer emits only this fixed failure-ID set:

```text
sandbox-binary-digest-mismatch, codex-binary-digest-mismatch,
codex-code-identity-mismatch, codex-version-mismatch,
codex-sandbox-help-mismatch, snapshot-revision-mismatch,
snapshot-manifest-digest-mismatch, snapshot-tree-digest-mismatch,
controller-bundle-digest-mismatch, child-bundle-digest-mismatch,
node-runtime-digest-mismatch, launcher-bundle-digest-mismatch,
policy-digest-mismatch, static-binding-mismatch,
codex-seatbelt-profile-not-observed, controller-postflight-drift,
snapshot-postflight-drift, synthetic-secret-policy-not-observed,
live-checkout-policy-not-observed, snapshot-integrity-not-observed,
network-policy-not-observed, process-info-policy-not-observed,
bounded-cleanup-not-observed
```

## Seatbelt observation semantics

A `passed-subset` requires all of the following:

1. Caller-expected controller, child, Node runtime, launcher, stable policy, source snapshot,
   sandbox, signed Codex identity/bytes, version, help, and nonce bindings match before execution.
2. Fixed Apple code identity passes, and both Codex capability calls run through the explicit
   Seatbelt profile only after static binding success.
3. The live checkout and sealed snapshot are canonical, non-overlapping, and outside the plugin;
   Codex is outside every prohibited root and all paths pass the injection filter before temp use.
4. The snapshot has the exact JSONUtils manifest contract, owner-only modes, bounded exact set,
   no `.git`, symlink, special file, or hardlink, and reproducible manifest/tree/revision digests.
5. Synthetic secret and live-checkout control reads succeed both before and after their exact helper
   negatives return `EXIT_DENIED` from `EPERM` under the intended profiles.
6. The source manifest is readable in Seatbelt without source mutation. Disposable mirror chmod/
   write baselines succeed, exact helper negatives return `EXIT_DENIED`, and source/mirror before/
   after digests remain equal; ledger-copy presence is irrelevant.
7. Loopback control connections succeed before and after its exact helper negative is denied; a
   timeout or ordinary network error is a mismatch.
8. A same-UID sibling remains alive and visible before and after its exact helper negative is denied;
   a missing target or ordinary `ps` failure is a mismatch.
9. Every static binding is recomputed postflight; source and controller postflight checks pass.
10. Every child exits and only exact known temporary files/empty directories are removed. Unknown
   residuals are retained behind owner-only directories; no recursive deletion follows unknown
   paths and no retained path is reported.
11. A no-ACL current-owner `0700` parent remains the same inode; the new `0600` report is fsynced,
    rechecked, bounded to 128 KiB, and summarized by SHA-256.

This is observed Seatbelt policy behavior for one local child. It is not an immutable mount, UID or
PID namespace, external controller, protected launcher, protected signer, full six-role topology,
or proof that no model process exists elsewhere on the host.

## Docker preflight

The legacy contract is `codex-external-controller-runtime-probe@1.1.0` with coverage
`credential-snapshot-subset`. Plugin 0.5.0 still disables container creation. A Docker `--run`
request produces `not-run` with `runtime-execution-disabled`; it never starts or pulls a container.

The future Docker contract describes three fake workloads:

1. `codex-sentinel`: no checkout or snapshot mount;
2. `mcp-sentinel`: sealed snapshot mounted read-only;
3. `validation-sentinel`: same snapshot in a separate sandbox.

Future runtime invariants include distinct non-zero UIDs and PID/IPC/mount/network namespaces,
non-privileged/read-only-root/no-new-privileges/capability-empty workloads, no Docker socket or host
`/proc`, unchanged read-only snapshot digests, empty authentication roots, foreign-canary denial,
and complete container/volume cleanup. None is currently observed by the Docker path.

## Fixed negative claims

Neither a Seatbelt `passed-subset` nor Docker preflight may upgrade these facts:

```json
{
  "secretIsolationVerified": false,
  "immutableMountVerified": false,
  "pidNamespaceVerified": false,
  "userNamespaceVerified": false,
  "controllerIsolationVerified": false,
  "signerIsolationVerified": false,
  "trustedSigners": 0,
  "modelInvocationAbsenceVerified": false,
  "currentTaskRegistryVerified": false,
  "topologyComplete": false,
  "outcomeEligible": false,
  "confirmedCoverageEligible": false
}
```

Do not treat Seatbelt denials, namespace digests, a plugin bundle hash, Codex help output, a
synthetic canary, or a passed subset as trusted identity, complete topology, real Codex behavior,
model evidence, receipt proof, or transparency evidence.
