# AI 治理决策记录

本文记录可复用的 AI rules、skills、治理脚本和协作入口变更，避免规则进化只留下关键词，无法追溯为什么沉淀、同步到哪里、由哪条测试锁住。

## 记录规则

- 只有可复用的规则沉淀、治理门禁补强、入口同步策略或 skill 契约变化需要登记；一次性偏好和未验证猜测不登记。
- 每条记录必须写清触发条件、反例、适用边界、回写追踪和锁定测试。
- 回写追踪必须包含反引号包裹且真实存在的文件路径；锁定测试必须包含反引号命令，`node` 命令里的本地脚本或测试路径必须真实存在。

## 决策记录

| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-07-07 | 收紧 AI 资产注册表证据和预算所有权自检 | 注册表证据可能混入自由文本，预算规则同一文件可被重复登记但门禁仍通过 | `必需文件、人工看过` 这类弱证据，或两个预算表同时声明同一治理规则文件 | 适用于 AI 协作资产注册表、治理脚本和预算规则表的可审计门禁，不替代业务功能测试 | `docs/AI-ASSET-REGISTRY.md`, `scripts/ci/aiGovernanceAssetRegistryEvidence.mjs`, `scripts/ci/maintainabilityBudgetReport.mjs`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node --test scripts/ci/maintainabilityBudgetReport.test.mjs`; `node scripts/ci/check-ai-governance.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --top 8 --no-all` |
| 2026-07-07 | 建立 AI 治理决策账本 | 规则进化已有关键词门禁，但缺少结构化记录说明为什么沉淀、同步到哪里、由哪条测试防退化 | 只在 Playbook 写“决策记录”，却没有可审计账本或结构化校验 | 适用于 AI rules、skills、协作入口和治理脚本的长期规则沉淀，不登记一次性偏好或未验证猜测 | `docs/AI-GOVERNANCE-DECISIONS.md`, `scripts/ci/aiGovernanceDecisionLedger.mjs`, `scripts/ci/aiGovernanceDecisionLedgerReferences.mjs`, `scripts/ci/aiGovernanceDecisionReferenceRule.mjs`, `scripts/ci/aiGovernanceChecks.test.mjs`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --top 10 --no-all` |
