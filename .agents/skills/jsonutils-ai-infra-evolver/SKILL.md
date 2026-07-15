---
name: jsonutils-ai-infra-evolver
description: JSONUtils AI 协作基建演进技能。用户要求审计、建设或升级 rules、skills、MCP、Agent 委派、evals、outcomes、反馈学习、治理 scorecard、hooks 或“让仓库更会进化”时必须使用；普通业务功能、产品内 Gemini 修复、一般重构和一次性文档整理不要触发。
metadata:
  version: "0.1.29"
  tags: [jsonutils, ai-infra, evals, skills, mcp, governance, evolution]
---

# JSONUtils AI Infra Evolver

把 coding agents 的 rules、skills、MCP、Agent profiles 与治理推进为可测、可回放、可撤销的演进系统；不处理产品内 AI 能力。

## 必读文件

1. `AGENTS.md`
2. `rules/code-style.md`
3. `docs/AI-ENGINEERING-PLAYBOOK.md`
4. `docs/AI-EVOLUTION-PLAYBOOK.md`

## 按任务读取

- 先用治理 MCP `ai_decision_summary`；改 rules/skills/MCP/门禁或追溯反例时读 `docs/AI-GOVERNANCE-DECISIONS.md`。
- 先用治理 MCP `ai_asset_inventory` 读取 bounded 摘要；新增、修改或审计 AI 协作资产时再读 `docs/AI-ASSET-REGISTRY.md` 全量账本。
- 写 outcome/receipt、改 checker 或查账本失败时读 `evals/ai-governance/README.md`。
- 捕获未满足 trial 前置条件的信号或设计 A/B 时读 `evals/ai-governance/feedback-inbox.jsonl` 与 `evals/ai-governance/experiments.json`。
- 改项目维护流程时读 `.agents/skills/jsonutils-maintainer/SKILL.md`。

## 工作流

1. 运行 `git status --short --branch`，保护用户和其它 Agent 的现有修改。
2. 可独立并行时委派固定 explorer/worker/verifier；主线程锁边界并整合，worker 必须收到写入白名单。
3. 建立治理、预算、MCP stdio、eval corpus、behavior outcome coverage 与 mandatory-context 双基线；时效结论核对一手来源。
4. AI 基建的 source of truth 必须入库；workspace/index/HEAD 依次只证明未 ignore、下一提交候选、当前提交可 clone。仓库不是 plugin，只有 `plugins/<name>/` 是插件包；`.agents/plugins/marketplace.json` 不自动安装，先 `--check`，明确同意后才 `--apply`。个人 cache 不证明 registration/runtime trust。
5. 先把纠偏、失败或规范变化写成脱敏 eval case；没有代表 case，长期规则只作提案。
6. A/B 绑定同一任务、fixture/base environment、互斥 split 与至少 3 次 paired repetitions；实施型 eval 使用隔离可写工作区、脱敏 execution transcript 与前后状态快照。基础设施无效不计 behavior fail，未验信指标为 `unavailable`。
7. 真实 outcome 绑定 trial receipt；legacy v1 仅留历史，`schemaVersion 3` 锁 `chain.sequence`、`chain.previousHash`、`supersession.previousOutcomeId` 和 `feedbackDisposition`。fixed runner 不写账；两个 writer 均 preview-first，仅本地显式写入，禁止自动化或手改 JSONL。字段由当前受控证据/source/ledger 派生；未验信 trace 只收闭字段 `redacted` observation 且永不计分。细则按任务读 `evals/ai-governance/README.md`。
8. `deterministic-case` 仅可即时重放；`component-boundary` 不进 behavior 分母或 active outcome。外部前置单列 `blockedFocus`，`nextFocus` 继续选择仓内可执行项。fixture/静态契约、安装副本/本机 finding、同仓 signer、caller-controlled proof 和同 UID sandbox 均只是 component-only。
9. MCP 声明、当前任务注册发现与工具选择分开评分；注册前置失败先进入脱敏 feedback signal，不回填 tool-selection outcome。最小纵切同时包含数据、读取入口、负例与真实链路；`top` / `limit` 只裁剪展示，不改变全局事实。
10. 证据稳定后再做规则/skill 回写；决策记录写清触发、反例、边界、回写追踪和锁定测试。
11. 新资产登记 `docs/AI-ASSET-REGISTRY.md`；发布变更同步 `frontend/package.json`、`frontend/package-lock.json` 与 `CHANGELOG.md`，最后复跑行为、协议、治理、预算和版本门禁。

子 Agent 委派标明拆分边界、读写范围、排除项、期望输出、未覆盖风险；主线程负责整合，否则收窄。
复盘沉淀写触发条件、验证方式、适用边界；用脚本或可复核日志成可验证闭环，再治理校验。
输出模板依次为任务：、结论：、证据：、修改文件：、验证：、未覆盖：、下一步建议：。

## 常用验证命令

```bash
node scripts/ci/check-ai-evolution-evals.mjs
node scripts/ci/check-ai-evolution-evals.mjs --json
node scripts/ci/run-ai-evolution-cases.mjs --all --json
node scripts/ci/manage-project-plugins.mjs --check
node --test scripts/ci/aiGovernanceCodexExternalControllerAttestedPreflight.test.mjs
node --test scripts/mcp/*.test.mjs
node scripts/ci/write-ai-governance-artifacts.mjs --check
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all
node scripts/ci/check-version-consistency.mjs
```

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
npm run check:preloads
```

## 重点边界

- 静态 scorecard 不等于行为有效；没有真实 outcome 保持 unknown/warn。
- Registration/runtime trust 细则见 Playbook；feedback、安装/冒烟、adapter/sandbox/本地签名只算 component。fresh registry 与仓外受保护 launcher/signer/state 未验证前保持 blocked/unavailable、零写账，且 blockedFocus 不覆盖仓内 nextFocus。
- `--apply` 需明确授权；禁止隐式调用、覆盖异源或删除个人 selector，完成后仍需 fresh task。
- `.codex/agents/` 仅允许 explorer 只读、worker 按父任务白名单写、verifier 只验证不修源码；静态 profile 不证明真实角色选择。
- `.codex/hooks.json` 仅允许受信的 `SessionStart` advisory；禁止读取敏感上下文、联网、写入或阻断，component case 不证明新任务触发。
- MCP 只开固定只读 newline-delimited JSON-RPC，不开 shell/路径；eval 不存 prompt、推理、凭据或正文。Git/hash、安装 finding 和用户级静态 `http_headers` 都不建立 trust 或 behavior outcome。
- 新 skill 需 trigger 正例、近负例和基线；产品 AI 坚持本地规则优先、用户手动触发和敏感内容不外泄。
- 回写后运行 `node scripts/ci/check-ai-governance.mjs` 并复核 mandatory-context budget。
