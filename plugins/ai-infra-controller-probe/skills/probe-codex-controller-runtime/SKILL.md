---
name: probe-codex-controller-runtime
description: Run keyless, component-only controller probes, including a signed macOS Seatbelt zero-model sentinel over a JSONUtils sealed snapshot and the existing Docker readiness preflight. Use when auditing canonical snapshot boundaries, zero source mutation, disposable write-denial controls, loopback network denial, sibling process-info denial, Codex code identity/binary/help bindings, or readiness before a protected Codex/MCP trial. Do not use for real model execution, API-key handling, ordinary Docker debugging, or trusted-attestation claims.
---

# Probe Codex Controller Runtime

Use this skill to measure either the existing Docker `credential-snapshot-subset` preflight or the macOS `macos-seatbelt-policy-subset`. Treat every report as an unprotected installed-copy self-report until an independent protected host and signer verify it. The JSONUtils repository owns the canonical plugin source, manifest, tests, and release policy.

## Safety boundary

- Never run `codex exec` or any Agent/model command. The Seatbelt sentinel may call only a canonical Codex binary's `--version` and `sandbox --help`, both inside an explicit Seatbelt profile under empty read-only `HOME` / `CODEX_HOME` and only after all static bindings match.
- Before Codex runs, require fixed Apple `codesign` policy: strict designated-requirement verification, `Identifier=codex`, Developer ID `TeamIdentifier=2DC432GLL2`, hardened runtime, and caller-bound `codexCodeIdentitySha256`.
- Reject `CODEX_API_KEY` / `OPENAI_API_KEY`. Never read saved authentication, user configuration, prompt, transcript, model output, or environment values.
- Never expose the live checkout to the tested read operation. The Seatbelt control group may read one fixed `AGENTS.md`; the sandboxed negative must deny that canonical checkout root.
- Require a real manifest `2.0.0` `.jsonutils-ai-snapshot.json` sealed snapshot. Reproduce its domain-separated source-state v2 revision from non-ledger path/mode/bytes; HEAD remains sealed audit metadata, while ledger copies may be present or absent read-only. Reject `.git`, symlink, special file, hardlink, bounds drift, exact-set drift, digest drift, revision drift, or overlap with the live checkout/plugin.
- Never chmod, write, create, or unlink anything in the source snapshot. Run baseline and exact-denial mutation controls only on a disposable mirror under an owned `/private/tmp` root; retain unknown residuals rather than recursively deleting them.
- Classify a deny only when the fixed helper observes `EPERM` and the same target/service passes both pre- and post-denial controls. Treat `EACCES`, `EROFS`, timeout, connection refusal, missing process, or ordinary tool failure as mismatch.
- Reject quote, backslash, C0, or DEL in every path before temporary creation. Resolve every security-sensitive directory and binary to an exact `realpath`; forbid Codex under the plugin, live checkout, source snapshot, output parent, or `/private/tmp`.
- Never pull an image. Require an already-local image referenced by `name@sha256:<digest>` and use pull policy `never`.
- Keep Docker execution fail closed until an independently audited probe-image policy is pinned. The legacy Docker path remains preflight-only and never creates containers.
- Never write receipt/outcome ledgers, candidate data, prompts, commands, stdout/stderr, container IDs, PIDs, environment values, canary values, `/proc`, or mountinfo into the report.
- Keep secret/immutable mount/PID namespace/user namespace/controller/signer/model-absence/current-registry/topology/outcome claims false even when Seatbelt returns `passed-subset`.

## Workflow

1. Read `references/report-contract.md` before interpreting either report.
2. On macOS, confirm `/usr/bin/sandbox-exec` exists and obtain caller-expected bindings independently. The bundled helpers may generate candidate digests for local testing, but they are not a protected host or signer:

```bash
node --input-type=module -e '
import { collectCodexPreflightExpectations, collectSeatbeltSentinelStaticExpectations } from "./scripts/seatbelt-sentinel.mjs";
const codex = await collectCodexPreflightExpectations("<canonical-codex-binary>");
const plugin = collectSeatbeltSentinelStaticExpectations();
console.log(JSON.stringify({ ...codex, ...plugin }));
'
```

3. Run the Seatbelt sentinel only with canonical absolute paths and independently supplied expected values:

```bash
node scripts/run-seatbelt-sentinel.mjs \
  --snapshot <canonical-sealed-snapshot> \
  --live-checkout <canonical-live-checkout> \
  --snapshot-revision <worktree-sha256> \
  --snapshot-manifest-sha256 <sha256> \
  --snapshot-tree-sha256 <sha256> \
  --controller-bundle-sha256 <sha256> \
  --child-bundle-sha256 <sha256> \
  --node-runtime-sha256 <sha256> \
  --launcher-bundle-sha256 <sha256> \
  --policy-sha256 <sha256> \
  --trial-nonce-sha256 <sha256> \
  --sandbox-binary-sha256 <sha256> \
  --codex-binary <canonical-codex-binary> \
  --codex-binary-sha256 <sha256> \
  --codex-code-identity-sha256 <sha256> \
  --codex-version <single-version-string> \
  --codex-sandbox-help-sha256 <sha256> \
  --output <canonical-new-report-path-outside-all-input-roots>
```

4. Interpret `passed-subset` only as observed Seatbelt policy behavior for signed Codex capability calls, synthetic secret, live-checkout read, source snapshot read, disposable mirror mutation denials, loopback network, and sibling process info. `rejected` may contain honest partial positive observations; derive every positive claim from its corresponding observations.
5. Use a canonical current-owner `0700` output parent with no ACL. The sentinel creates and fsyncs one new `0600` inode, rechecks parent/inode identity, and returns its SHA-256 in the bounded CLI summary. Errors never echo paths, child stderr, canary material, or commands.

## Docker preflight

The older Docker path remains available as a separate preflight-only component:

1. Resolve a regular non-symlink Docker CLI binary and an explicit local Unix socket. Do not reuse Docker config, registries, or network credentials.
2. Obtain independent SHA-256 bindings for the topology plan, desired sealed snapshot, trial nonce, and three workload images. Do not let the report become its own expected binding.
3. Start with preflight only:

```bash
env -u CODEX_API_KEY -u OPENAI_API_KEY \
  node scripts/run-controller-probe.mjs \
  --docker-binary <absolute-regular-docker-binary> \
  --docker-host unix://<absolute-docker-socket> \
  --image-ref <local-image>@sha256:<digest> \
  --image-sha256 <digest> \
  --snapshot-sha256 <digest> \
  --topology-plan-sha256 <digest> \
  --trial-nonce-sha256 <digest> \
  --output <absolute-new-report-path>
```

4. Do not enable Docker `--run`. Even with a daemon, local image, and sealed snapshot, this path returns `not-run` with `runtime-execution-disabled`.
5. Report the exact status:
   - `not-run`: only preflight facts exist; no runtime observation occurred.
   - `passed-subset`: the Seatbelt sentinel may emit this only for its narrower macOS policy subset; the Docker path does not.
   - `rejected`: one or more runtime invariants failed; do not retry automatically.
6. Keep the generated report outside the checkout. Do not append any Agent outcome for either component case.

## Interpretation

- Seatbelt is a direct child policy, not a UID/PID/user/mount/network namespace. The same local user still controls the plugin, policy, snapshot modes, and launcher.
- The source snapshot is never a mutation target, including negative probes. A disposable manifest mirror supplies successful pre/post chmod/write controls around exact helper `EXIT_DENIED` negatives; source and mirror before/after digests must remain equal.
- The Seatbelt policy digest binds a stable closed template with path placeholders. Canonical runtime paths are safely substituted but are never emitted in the report. Child, Node runtime, launcher, controller, sandbox, Codex bytes, code identity, and snapshot bindings are reverified postflight.
- The probe is intentionally narrower than the six-role topology. It does not exercise controller isolation, sanitizer, signer, real Codex Agent execution, a model proxy, or a real MCP facade.
- Ordinary Docker Desktop containers share a Linux VM. Distinct PID/IPC/mount/network namespaces do not prove distinct VMs or user namespaces.
- A project-owned plugin installed into a user cache remains controlled by the same local user and may derive from the target project. Its bundle digest is a binding primitive, not a trusted identity.
- An independently verified Seatbelt `passed-subset` report can justify the next protected-runtime experiment; it cannot justify confirmed behavior coverage, a trusted signer, or production execution.

## Validation

After modifying this skill, run:

```bash
node --test scripts/controller-probe.test.mjs
node --test scripts/seatbelt-sentinel.test.mjs
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" .
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py" ../../..
```
