# 控制器探针报告契约

运行探针或解读报告前，先阅读本参考。

## 目录

- [共享信任边界](#共享信任边界)
- [macOS Seatbelt 哨兵](#macos-seatbelt-哨兵)
- [Seatbelt 闭合报告](#seatbelt-闭合报告)
- [Seatbelt 观测语义](#seatbelt-观测语义)
- [Docker 预检](#docker-预检)
- [固定负向声明](#固定负向声明)

## 共享信任边界

两个生产器都是 `project-plugin-installed-copy-unverified`。其报告是组件证据，不是
attestation。插件 bundle 摘要可以绑定字节，但不能证明外部身份、受保护时间、不双标、
控制器隔离或签名方隔离。

任何报告都绝不得包含凭据、环境值、绝对路径、金丝雀字节、命令、stdout、
stderr、提示词、转录、PID 或模型输出。每份报告都必须位于插件、快照和活动 checkout 之外。
其规范父目录必须由当前 UID 所有，模式为 `0700` 且没有 ACL；将报告创建为新 `0600` inode，
对其执行 `fsync`，并重新检查父目录/inode/ACL 身份。有界 CLI 摘要包含报告 SHA-256。

## macOS Seatbelt 哨兵

插件 0.5.1 运行真实 Darwin `/usr/bin/sandbox-exec` 哨兵。它只执行合成 Node
工作负载和两个 Codex 能力探针：

- `<codex-binary> --version`;
- `<codex-binary> sandbox --help`.

执行任一调用前，使用固定 Apple `codesign` 策略验证规范的普通 Codex 二进制：
严格的磁盘上/指定要求验证、标识符 `codex`、Developer ID
`TeamIdentifier=2DC432GLL2`、强化运行时标志和精确指定要求。将规范身份字段和完整 SHA-256 CDHash
绑定为 `codexCodeIdentitySha256`。拒绝位于插件、活动 checkout、源快照、输出父目录或 `/private/tmp` 下的二进制。

只有每个调用方静态绑定都匹配后，生产器才可创建其固定位于 `/private/tmp` 的
临时根目录并执行 Codex。两个调用都在显式 `codexCapability` Seatbelt
profile 内运行，使用空且只读的 `HOME` 和 `CODEX_HOME`；不请求 `codex exec`、模型、API、用户配置、
已保存认证或任务注册表。Stderr 被丢弃，绝不进入报告。帮助 stdout 只以调用方预期 SHA-256 表示。

稳定策略模板包含独立的 `readAllow`、`readDeny`、`writeDeny`、`networkDeny`、
`processInfoDeny` 和 `codexCapability` profile。`policySha256` 对带字面路径占位符的
闭合模板计算哈希。创建任何临时目录前，拒绝每条路径中的引号、反斜杠、C0 或 DEL。运行时密钥/活动路径经 `realpath` 规范化后安全替换；因此随机路径不会导致预期策略绑定不稳定。

真实已封存快照绝不传给 chmod、create、write 或 unlink，负例探针也不例外。
源变更固定为 false，并在前后验证元数据敏感的源摘要与 manifest/tree/
revision 绑定。基线 chmod/write 和精确 `EXIT_DENIED`
Seatbelt 负例只针对自有临时根目录下的一次性清单镜像运行。
账本副本可存在也可缺席；`ledgerCopiesPresent` 只供信息展示，绝不是快照完整性前置条件。

## Seatbelt 闭合报告

顶层对象必须按以下顺序精确包含这些键：

```text
schemaVersion, reportType, contract, bindings, execution, observations, claims, result
```

`schemaVersion` 为 `2`。`reportType` 为
`codex-external-controller-seatbelt-sentinel`.

### 契约

精确对象为：

```json
{
  "id": "codex-external-controller-seatbelt-sentinel-execution",
  "version": "2.2.0",
  "evidenceScope": "component-only",
  "coverage": "macos-seatbelt-policy-subset",
  "producer": "project-plugin-installed-copy-unverified"
}
```

### 绑定

精确键为：

```text
snapshotRevision, snapshotManifestSha256, snapshotTreeSha256,
controllerBundleSha256, childBundleSha256, nodeRuntimeSha256,
launcherBundleSha256, policySha256, trialNonceSha256,
sandboxBinarySha256, codexBinarySha256, codexCodeIdentitySha256,
codexVersion, codexSandboxHelpSha256
```

每个摘要都是 64 个小写字符的 SHA-256。`snapshotRevision` 为
`worktree-<sha256>`。`codexVersion` 是单个有界可打印版本字符串。
接受的已封存清单为 `2.0.0`，revision profile 为
`jsonutils-evolution-source-state-v2`：revision 绑定非账本路径/模式/原始字节，但不绑定 HEAD；
HEAD 保持为单独封存的审计元数据。

调用方必须提供预期的 controller、child、Node runtime、launcher、policy、sandbox、Codex
字节/代码身份、快照、nonce、版本和帮助绑定。生产器在 Codex 运行前重新计算每个
静态值，然后在探针结束后重新计算 controller/child/Node/launcher/policy/sandbox/Codex
字节/代码身份和快照绑定。`collectSeatbeltSentinelStaticExpectations` 与
`collectCodexPreflightExpectations` 是本地候选生成器，不是独立信任根。

### 执行

精确键为：

```text
origin, platform, architecture, sandboxMechanism, sandboxCommandObserved,
realCodexAgentSpawns, modelInvocationRequested, credentialMaterialRequested,
candidateGenerated, automaticLedgerWrites, retryCount
```

固定值为：

- `origin="project-plugin-installed-copy-unverified"`;
- `platform="darwin"`;
- `sandboxMechanism="seatbelt-direct"`;
- `realCodexAgentSpawns=0`;
- `modelInvocationRequested=false`;
- `credentialMaterialRequested=false`;
- `candidateGenerated=false`;
- `automaticLedgerWrites=false`;
- `retryCount=0`.

至少一条直接 Seatbelt 命令返回后，`sandboxCommandObserved` 为 true。这不表示
完整子集已通过。

### 观测

精确嵌套对象为：

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

除 SHA-256、可空 SHA-256 字段和非负整数 `residualNonceObjects` 外，观测字段均为布尔值。
`canarySha256` 是随机合成字节的单向摘要，在临时状态存在前可为 null。如果很早就拒绝，源、清单和镜像摘要可为 null。`sourceMutationAttempted` 始终为 false。账本副本允许为 true 或 false，
并且只读报告；其存在不是完整性要求、outcome 或签名方声明。

每个基线/控制布尔值都表示，针对同一个仍可用的目标或服务，禁止前和禁止后控制都成功。
只有这些控制通过，且固定 helper 因底层 `EPERM` 返回 `EXIT_DENIED=73` 时，deny 布尔值才可为 true。`EACCES`、`EROFS`、超时、
连接拒绝、进程目标缺失、普通 `ps` 失败、helper 不匹配或畸形
profile 绝不归类为策略禁止。

### 声明

精确键为：

```text
seatbeltPolicyObserved, snapshotIntegrityObserved, syntheticSecretPolicyObserved,
networkPolicyObserved, processInfoPolicyObserved, boundedCleanupObserved,
secretIsolationVerified, immutableMountVerified, pidNamespaceVerified,
userNamespaceVerified, controllerIsolationVerified, signerIsolationVerified,
trustedSigners, modelInvocationAbsenceVerified, currentTaskRegistryVerified,
topologyComplete, outcomeEligible, confirmedCoverageEligible
```

只有前六项声明可以变为 true，且必须从对应的完整观测中派生。
其余布尔值固定为 false，`trustedSigners` 固定为 `0`。
`modelInvocationRequested=false` 不能建立 `modelInvocationAbsenceVerified`。

### 结果

精确键为：

```text
status, runtimeSubsetExecutionObserved, failures
```

`status` 为 `passed-subset` 或 `rejected`。`runtimeSubsetExecutionObserved` 镜像直接 Seatbelt
执行，因此真实的部分 `rejected` 报告可保留 true 观测和 true 派生子集声明。
`failures` 是有界小写安全 ID 的唯一数组。调用方不得擦除部分证据，或将基础设施拒绝转换为 Agent 行为失败。

生产器只产生以下固定失败 ID 集：

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

## Seatbelt 观测语义

`passed-subset` 必须满足以下所有条件：

1. 调用方预期的 controller、child、Node runtime、launcher、稳定 policy、源快照、
   sandbox、已签名 Codex 身份/字节、版本、帮助和 nonce 绑定在执行前匹配。
2. 固定 Apple 代码身份通过，且两个 Codex 能力调用只在静态绑定成功后经显式
   Seatbelt profile 运行。
3. 活动 checkout 和已封存快照规范、不重叠且位于插件之外；
   Codex 位于每个禁止根目录之外，所有路径在临时使用前都通过注入过滤。
4. 快照具有精确 JSONUtils 清单契约、仅所有者模式、有界精确集合，
   不含 `.git`、符号链接、特殊文件或硬链接，且 manifest/tree/revision 摘要可复现。
5. 在目标 profile 下，合成密钥和活动 checkout 控制读在精确 helper 负例因 `EPERM` 返回 `EXIT_DENIED` 前后都成功。
6. Seatbelt 可读取源清单，且源快照没有变更。一次性镜像 chmod/
   写入基线成功，精确 helper 负例返回 `EXIT_DENIED`，且源/镜像前后摘要保持相等；账本副本是否存在与此无关。
7. 回环控制连接在精确 helper 负例被禁止前后均成功；超时或普通网络错误属于不匹配。
8. 同 UID 同级进程在精确 helper 负例被禁止前后均保持活跃且可见；目标缺失或普通 `ps` 失败属于不匹配。
9. 执行后重新计算每个静态绑定；源快照和 controller 执行后检查通过。
10. 每个子进程都退出，且只删除精确已知临时文件/空目录。未知残留保留在仅所有者目录后；不得沿未知路径递归删除，也不得报告任何保留路径。
11. 无 ACL、当前所有者的 `0700` 父目录保持为同一 inode；新 `0600` 报告经 fsync、重新检查、限制在 128 KiB，并以 SHA-256 摘要。

这是对一个本地子进程的已观测 Seatbelt 策略行为。它不是不可变挂载、UID 或 PID 命名空间、外部 controller、受保护 launcher、受保护签名方、完整六角色拓扑，也不能证明主机其他位置不存在模型进程。

## Docker 预检

旧契约为 `codex-external-controller-runtime-probe@1.1.0`，覆盖范围为
`credential-snapshot-subset`。插件 0.5.1 仍禁止创建容器。Docker `--run`
请求产生带 `runtime-execution-disabled` 的 `not-run`；它绝不启动或拉取容器。

未来 Docker 契约描述三个虚拟工作负载：

1. `codex-sentinel`：不挂载 checkout 或快照；
2. `mcp-sentinel`：只读挂载已封存快照；
3. `validation-sentinel`：在独立 sandbox 中使用同一快照。

未来运行时不变式包括不同的非零 UID 和 PID/IPC/挂载/网络命名空间、
非特权/只读根/无新特权/空 capability 工作负载、不含 Docker 套接字或主机
`/proc`、不变的只读快照摘要、空认证根、外来金丝雀禁止，以及完整容器/卷清理。Docker 路径当前未观测到任何一项。

## 固定负向声明

Seatbelt `passed-subset` 和 Docker 预检都不得升级以下事实：

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

不得将 Seatbelt 禁止、命名空间摘要、插件 bundle 哈希、Codex 帮助输出、
合成金丝雀或已通过子集视为可信身份、完整拓扑、真实 Codex 行为、
模型证据、receipt 证明或透明度证据。
