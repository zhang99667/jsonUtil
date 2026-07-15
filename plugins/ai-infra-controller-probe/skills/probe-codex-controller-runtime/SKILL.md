---
name: probe-codex-controller-runtime
description: 运行无密钥、仅组件级的控制器探针，包括针对 JSONUtils 已封存快照的已签名 macOS Seatbelt 零模型哨兵和现有 Docker 就绪预检。适用于审计规范快照边界、源快照零修改、一次性写禁止控制、回环网络禁止、同级进程信息禁止、Codex 代码身份/二进制/帮助绑定，或受保护 Codex/MCP 试验前的就绪性。不得用于真实模型执行、API 密钥处理、普通 Docker 调试或可信证明声明。
---

# Codex 控制器运行时探针

使用本 skill 测量现有 Docker `credential-snapshot-subset` 预检或 macOS `macos-seatbelt-policy-subset`。在独立受保护主机和签名方完成验证前，每份报告都只能视为未受保护安装副本的自报。JSONUtils 仓库拥有规范的插件源码、清单、测试和发布策略。

## 安全边界

- 绝不运行 `codex exec` 或任何 Agent/模型命令。Seatbelt 哨兵只能调用规范 Codex 二进制的 `--version` 和 `sandbox --help`；两者都必须在空且只读的 `HOME` / `CODEX_HOME` 下经显式 Seatbelt profile 执行，并且只能在所有静态绑定匹配后运行。
- Codex 运行前必须满足固定 Apple `codesign` 策略：严格指定要求验证、`Identifier=codex`、Developer ID `TeamIdentifier=2DC432GLL2`、强化运行时，以及由调用方绑定的 `codexCodeIdentitySha256`。
- 拒绝 `CODEX_API_KEY` / `OPENAI_API_KEY`。绝不读取已保存认证、用户配置、提示词、转录、模型输出或环境值。
- 绝不将活动 checkout 暴露给待测读操作。Seatbelt 控制组可读取一个固定 `AGENTS.md`；沙箱负例必须禁止访问该规范 checkout 根目录。
- 要求使用含真实 `2.0.0` `.jsonutils-ai-snapshot.json` 清单的已封存快照。从非账本路径/模式/字节重建其分域 source-state v2 revision；HEAD 保持为已封存审计元数据，账本副本可以只读存在或缺席。拒绝 `.git`、符号链接、特殊文件、硬链接、边界漂移、精确集合漂移、摘要漂移、revision 漂移，或与活动 checkout/插件重叠。
- 绝不对源快照执行 chmod、写入、创建或 unlink。基线与精确禁止的变更控制只能针对自有 `/private/tmp` 根目录下的一次性镜像；保留未知残留，不得递归删除。
- 只有固定 helper 观测到 `EPERM`，且同一目标/服务的禁止前后控制均通过时，才能将结果归类为禁止。`EACCES`、`EROFS`、超时、连接拒绝、进程缺失或普通工具失败都视为不匹配。
- 创建临时目录前，拒绝每条路径中的引号、反斜杠、C0 或 DEL。将每个安全敏感目录和二进制解析为精确 `realpath`；禁止 Codex 位于插件、活动 checkout、源快照、输出父目录或 `/private/tmp` 下。
- 绝不拉取镜像。要求使用已在本地存在且以 `name@sha256:<digest>` 引用的镜像，并使用 `never` 拉取策略。
- 在锁定经独立审计的探针镜像策略前，Docker 执行必须保持失败关闭。旧 Docker 路径仍只做预检，绝不创建容器。
- 报告中绝不写入 receipt/outcome 账本、候选数据、提示词、命令、stdout/stderr、容器 ID、PID、环境值、金丝雀值、`/proc` 或 mountinfo。
- 即使 Seatbelt 返回 `passed-subset`，密钥/不可变挂载/PID 命名空间/用户命名空间/控制器/签名方/模型未调用/当前注册表/拓扑/outcome 声明也必须保持 false。

## 工作流

1. 解读任何一种报告前，先读取 `references/report-contract.md`。
2. 在 macOS 上确认 `/usr/bin/sandbox-exec` 存在，并独立获取调用方预期绑定。内置 helper 可以为本地测试生成候选摘要，但它们不是受保护主机或签名方：

```bash
node --input-type=module -e '
import { collectCodexPreflightExpectations, collectSeatbeltSentinelStaticExpectations } from "./scripts/seatbelt-sentinel.mjs";
const codex = await collectCodexPreflightExpectations("<canonical-codex-binary>");
const plugin = collectSeatbeltSentinelStaticExpectations();
console.log(JSON.stringify({ ...codex, ...plugin }));
'
```

3. 只使用规范绝对路径和独立提供的预期值运行 Seatbelt 哨兵：

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

4. `passed-subset` 只能解读为针对已签名 Codex 能力调用、合成密钥、活动 checkout 读取、源快照读取、一次性镜像变更禁止、回环网络和同级进程信息的已观测 Seatbelt 策略行为。`rejected` 可包含真实的部分正向观测；每项正向声明都必须从对应观测派生。
5. 使用规范的当前所有者 `0700` 且无 ACL 的输出父目录。哨兵创建并 fsync 一个新 `0600` inode，重新检查父目录/inode 身份，并在有界 CLI 摘要中返回其 SHA-256。错误绝不回显路径、子进程 stderr、金丝雀材料或命令。

## Docker 预检

较旧的 Docker 路径仍作为独立的仅预检组件可用：

1. 解析普通、非符号链接的 Docker CLI 二进制与显式本地 Unix 套接字。不复用 Docker 配置、注册表或网络凭据。
2. 为拓扑计划、目标已封存快照、试验 nonce 和三个工作负载镜像获取独立 SHA-256 绑定。不得让报告本身成为其预期绑定。
3. 开始时只执行预检：

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

4. 不要启用 Docker `--run`。即使有 daemon、本地镜像和已封存快照，该路径也会返回带 `runtime-execution-disabled` 的 `not-run`。
5. 报告精确状态：
   - `not-run`：只有预检事实；未发生运行时观测。
   - `passed-subset`：Seatbelt 哨兵只能针对其更窄的 macOS 策略子集产生该状态；Docker 路径不能。
   - `rejected`：一项或多项运行时不变式失败；不得自动重试。
6. 将生成的报告保存在 checkout 之外。不得为任一组件用例追加 Agent outcome。

## 解读

- Seatbelt 是直接子进程策略，不是 UID/PID/用户/挂载/网络命名空间。同一本地用户仍控制插件、策略、快照模式和 launcher。
- 源快照绝不是变更目标，负例探针也不例外。一次性清单镜像在精确 helper `EXIT_DENIED` 负例前后提供成功的 chmod/写入控制；源快照和镜像的前后摘要必须保持相等。
- Seatbelt 策略摘要绑定带路径占位符的稳定闭合模板。规范运行时路径会安全替换，但绝不写入报告。执行后会重新验证子进程、Node 运行时、launcher、controller、sandbox、Codex 字节、代码身份和快照绑定。
- 该探针故意比六角色拓扑更窄。它不测试控制器隔离、清洗器、签名方、真实 Codex Agent 执行、模型代理或真实 MCP facade。
- 普通 Docker Desktop 容器共享一个 Linux 虚拟机。不同 PID/IPC/挂载/网络命名空间不能证明存在不同虚拟机或用户命名空间。
- 安装到用户缓存的项目所有插件仍由同一本地用户控制，且可能派生自目标项目。其 bundle 摘要是绑定原语，不是可信身份。
- 经独立验证的 Seatbelt `passed-subset` 报告可支持进入下一个受保护运行时实验；它不能支持已确认行为覆盖、可信签名方或生产执行声明。

## 验证

修改本 skill 后运行：

```bash
node --test scripts/controller-probe.test.mjs
node --test scripts/seatbelt-sentinel.test.mjs
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" .
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py" ../../..
```
