# AI 治理决策记录

本文记录可复用的 AI rules、skills、治理脚本和协作入口变更，避免规则进化只留下关键词，无法追溯为什么沉淀、同步到哪里、由哪条测试锁住。

## 记录规则

- 只有可复用的规则沉淀、治理门禁补强、入口同步策略或 skill 契约变化需要登记；一次性偏好和未验证猜测不登记。
- 每条记录必须写清触发条件、反例、适用边界、回写追踪和锁定测试。
- 回写追踪必须包含反引号包裹且真实存在的文件路径；锁定测试必须包含反引号命令，至少一条 `node --test ...test.mjs` 回归或负向测试命令，`node` 命令里的本地脚本或测试路径必须真实存在。

## 决策记录

| 日期 | 决策 | 触发条件 | 反例 | 适用边界 | 回写追踪 | 锁定测试 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-07-07 | 收紧 AI 资产注册表证据和预算所有权自检 | 注册表证据可能混入自由文本，预算规则同一文件可被重复登记但门禁仍通过 | `必需文件、人工看过` 这类弱证据，或两个预算表同时声明同一治理规则文件 | 适用于 AI 协作资产注册表、治理脚本和预算规则表的可审计门禁，不替代业务功能测试 | `docs/AI-ASSET-REGISTRY.md`, `scripts/ci/aiGovernanceAssetRegistryEvidence.mjs`, `scripts/ci/maintainabilityBudgetReport.mjs`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node --test scripts/ci/maintainabilityBudgetReport.test.mjs`; `node scripts/ci/check-ai-governance.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --top 8 --no-all` |
| 2026-07-07 | 建立 AI 治理决策账本 | 规则进化已有关键词门禁，但缺少结构化记录说明为什么沉淀、同步到哪里、由哪条测试防退化 | 只在 Playbook 写“决策记录”，却没有可审计账本或结构化校验 | 适用于 AI rules、skills、协作入口和治理脚本的长期规则沉淀，不登记一次性偏好或未验证猜测 | `docs/AI-GOVERNANCE-DECISIONS.md`, `scripts/ci/aiGovernanceDecisionLedger.mjs`, `scripts/ci/aiGovernanceDecisionLedgerReferences.mjs`, `scripts/ci/aiGovernanceDecisionReferenceRule.mjs`, `scripts/ci/aiGovernanceChecks.test.mjs`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --top 10 --no-all` |
| 2026-07-08 | 收紧决策账本锁定测试为回归测试 | 决策账本已要求锁定测试，但任意 `node` 总检查命令也能冒充防退化证据 | 只登记 `node scripts/ci/check-ai-governance.mjs` 或 `git status`，没有能证明弱记录会失败的负向测试 | 适用于 AI rules、skills 和治理门禁决策记录的防退化证据，不替代业务功能、构建或发布验证 | `docs/AI-GOVERNANCE-DECISIONS.md`, `scripts/ci/aiGovernanceDecisionLedger.mjs`, `scripts/ci/aiGovernanceDecisionLedgerReferences.mjs`, `scripts/ci/aiGovernanceChecks.test.mjs`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --top 10 --no-all` |
| 2026-07-08 | 修正可维护性预算 `--no-all` 参数 | AI 治理验证命令依赖 `--no-all` 收窄输出，但 CLI 解析器未识别该参数 | 只在命令里写 `--no-all`，实际仍打印全量预算列表，靠人工忽略大输出 | 适用于可维护性预算门禁的输出收敛，不改变预算计算、失败判定或高使用率候选逻辑 | `scripts/ci/maintainabilityBudgetCliArgs.mjs`, `scripts/ci/maintainabilityBudgetCliArgs.test.mjs`, `scripts/ci/maintainability-budget-governance-checker-rules.mjs`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/maintainabilityBudgetCliArgs.test.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --no-all`; `node scripts/ci/check-ai-governance.mjs` |
| 2026-07-08 | 规范化可维护性预算登记路径 | 预算重复登记按原始字符串判断，路径写法差异可能绕过同一文件所有权检查 | 同一文件同时登记为 `./scripts/foo.mjs` 和 `scripts/foo.mjs`，门禁仍认为是两个不同文件 | 适用于可维护性预算规则表的所有权检查和规则文件自检，不改变行数统计口径或预算阈值 | `scripts/ci/maintainabilityBudgetReport.mjs`, `scripts/ci/maintainabilityBudgetReport.test.mjs`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/maintainabilityBudgetReport.test.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --top 12 --no-all`; `node scripts/ci/check-ai-governance.mjs` |
| 2026-07-08 | 收紧 Codex skill 核心章节识别 | Skill 契约用全文匹配和 `indexOf` 判断章节，正文伪标题可能绕过缺章节检查，共享章节解析也会被代码块里的 `#` 误截断 | 在正文里写 `## 工作流`，但不提供真正的二级标题章节，或在代码块里写 `# 注释` 导致章节提前结束 | 适用于 `.codex/skills/*/SKILL.md` 和 AI 文档章节引用的 Markdown 标题边界，不改变章节内关键词清单 | `scripts/ci/aiGovernanceCodexSkillContract.mjs`, `scripts/ci/aiGovernanceCodexSkillSectionContract.mjs`, `scripts/ci/aiGovernanceSectionReferences.mjs`, `scripts/ci/aiGovernanceChecks.test.mjs`, `docs/AI-GOVERNANCE-DECISIONS.md`, `CHANGELOG.md` | `node --test scripts/ci/aiGovernanceChecks.test.mjs`; `node scripts/ci/check-ai-governance.mjs`; `node scripts/ci/check-maintainability-budgets.mjs --top 12 --no-all` |
