# AI 工具配置说明

本项目已为主流 AI 编程助手配置了必要的规则和上下文文件。

## 支持的 AI 工具

### 1. Claude Code
**配置文件**: `CLAUDE.md`、`.claude/skills/jsonutils-maintainer/SKILL.md`、`.claude/skills/jsonutils-ai-infra-evolver/SKILL.md`、`.claude/agents/ai-infra-auditor.md`

Claude Code (Anthropic) 的项目指引文件，包含:
- 完整的项目结构说明
- 技术栈详情
- 代码规范和最佳实践
- 常见任务指引
- 故障排查指南

**使用方式**:
- Claude Code 会自动读取 `CLAUDE.md` 文件
- 文件内容会被用作项目上下文
- `.claude/skills/` 提供项目级原生 skill 发现入口；两个普通文件 adapter 必须完整读取对应 `.agents/skills/` canonical 文件，且由治理脚本逐字节防漂移
- `.claude/agents/ai-infra-auditor.md` 是项目级只读 Agent，只允许 Read/Grep/Glob，用于审计 rules、skills、MCP、plugins、hooks、evals 和治理证据
- adapter 文件存在只证明项目分发与静态映射，不证明真实 Claude 会话已经选择、加载或遵循 skill
- 提供更准确的代码建议和修复方案

### 2. Codex / OpenAI Coding Agent
**配置文件**: `AGENTS.md`、`.codex/config.toml`、`.codex/hooks.json`、`.codex/rules/default.rules`、`.codex/agents/*.toml`、`.agents/skills/jsonutils-maintainer/SKILL.md`、`.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`

Codex 使用 `AGENTS.md` 作为项目入口，并直接发现 `.agents/skills/` 中的项目技能。

JSONUtils 仓库不是 plugin，只有 `plugins/<name>/` 是可分发插件包。Codex 在 trusted project 中从 `.codex/config.toml` 直接注册固定治理 MCP，不依赖个人插件安装；仍需新任务观察实际 registry。`.agents/plugins/marketplace.json` 和 `plugins/` 是插件版本化 source of truth；`AVAILABLE` 只可发现，clone/open 不自动安装、启用或热加载插件。维护者先运行 `node scripts/ci/manage-project-plugins.mjs --check`，明确同意后才 `--apply`。用户目录只保存派生安装副本，项目所有权不提升 registration/runtime 信任。

**使用方式**:
- 开始任务前读取 `AGENTS.md` 和 `rules/code-style.md`
- 性能优化、重构、Scheme/CMD 解析改动参考 `docs/AI-ENGINEERING-PLAYBOOK.md`
- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。
- 部署 shell、本地 CI、GitHub shell helper 或 `.github/workflows/*.yml` 的 `workflow run` 块改动后运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，覆盖外层脚本、内联 run 和 `REMOTE_SCRIPT heredoc` 远端片段
- 手动懒加载 `import()`、相关 catch 或 `dispatchChunkLoadRecoveryEvent` 改动后运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`，避免旧 chunk 加载失败被业务 catch 吞掉
- 前端 Docker、Compose、Nginx 或静态资源发布改动后运行 `node scripts/ci/check-frontend-static-retention.mjs`
- 公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>`，确认当前入口声明的懒加载 chunk、CSS `url(...)` 二级资源和 CSS `@import` 链路可访问，并校验 JS/CSS `Content-Type` 没有被 fallback 成 HTML 伪装成成功
- 用户反馈旧 chunk URL 时，给公网资源巡检追加 `--extra-asset <url-or-path>` 纳入同一轮 404 和 MIME 诊断
- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。
- 项目通用执行委派使用 explorer、worker、verifier；AI 基建专项只读审计可用三端 `ai-infra-auditor` adapter。客户端权限配置只是默认值，父任务覆盖不放宽职责；静态 profile/adapter 只算 component evidence，真实选择、强隔离和零写入保持 unknown，零写入需完整 workspace manifest。
- Codex lifecycle 只允许单一 `SessionStart` advisory；项目和当前 hook 定义都需信任，不使用 bypass trust。runtime 不读 prompt/transcript/环境/用户配置、不联网、不写入、不阻断；配置、`/hooks` 可见或合成测试不算真实 behavior outcome。
- Codex command rules 是版本化项目资产，不是 plugin 或个人 cache：`.codex/rules/default.rules` 只增加 sandbox 外 `prompt`，不增加 `allow`。它依赖 trusted project 与启动加载，静态 canonical/component case 不证明真实 `execpolicy` 决策或不可绕过 enforcement。
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。
- 项目级 Codex skill 需要保留 frontmatter `name`/`description`/`metadata.version`/`metadata.tags`、`agents/openai.yaml` 和四个核心章节，避免迁移后不可触发、不可追踪或不可执行
- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，写入 `docs/AI-GOVERNANCE-DECISIONS.md` 决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。
- `.agents/skills/` 是唯一可编辑项目 skill 语义源码；Codex/Copilot 可直接发现，Claude 通过 `.claude/skills/` 的固定派生 adapter 路由。不要复制完整正文到 `.codex/skills/` 或手工维护第二套触发语义
- 本地 `check-ai-asset-distribution.mjs --workspace|--index` 与 CI `--head` 分别证明候选、下一次提交和当前提交；它们都不证明用户插件已安装
- 涉及 rules、skills、MCP、evals 或 outcome 学习时，使用 `.agents/skills/jsonutils-ai-infra-evolver/SKILL.md`，遵循 `docs/AI-EVOLUTION-PLAYBOOK.md` 并运行 `node scripts/ci/check-ai-evolution-evals.mjs`
- 项目 MCP 声明、trusted config 加载、当前任务注册发现和工具选择分开评分；`.codex/config.toml` 为原生入口，项目插件 `plugins/jsonutils-governance-mcp@0.2.2` 只作兼容包，配置、安装或冒烟都不代替新任务实际发现
- 真实 Codex trial 前必须先满足 external-controller topology 的闭字段 host binding、六方 trust/UID/namespace、只读 snapshot、keyless MCP 与 sanitizer/signer 契约；`node scripts/ci/run-ai-evolution-cases.mjs --case codex-external-controller-topology-boundary --json` 通过也只证明 component contract，不证明 runtime isolation
- 项目插件 0.5.0 的三 fake workload probe 使用 `node scripts/ci/run-ai-evolution-cases.mjs --case codex-external-controller-runtime-probe-boundary --json` 锁定 `credential-snapshot-subset` 本机安装副本自报边界；daemon 不可用或 gate 关闭时保持 `not-run`，且始终不产生 runtime 信任或 outcome
- macOS Seatbelt v2 锁 OpenAI code identity、source snapshot 零变更和 disposable mirror；attested preflight 另锁双角色 DSSE、七角色隔离、派生 state/challenge 与 pre-runtime 注入。仓内 Node/path candidate 只算 component，受保护 launcher/service 未落地前不能解除 registration behavior gate
- 用户级 Codex MCP 静态 header 只由项目资产 `plugins/codex-mcp-config-auditor@0.2.2` 在本机显式运行时做 value-free 审计；静态 `$ENV` 仍按风险处理，输出不得包含值、hash、长度、preview、原始错误或环境值，本机 finding 不算项目行为证据

### 3. Cursor AI
**配置文件**: `.cursorrules`、`.cursor/rules/**/*.mdc`

Cursor AI 的 `.cursorrules` 现在是薄入口，负责转发到主规范和 AI 工程闭环，避免复制旧规则后漂移；新增 `.cursor/rules/**/*.mdc` 项目规则时也要进入 AI 资产治理。

**使用方式**:
- Cursor 会自动读取 `.cursorrules` 文件
- Cursor 项目规则文件放入 `.cursor/rules/**/*.mdc` 时，必须同步资产注册表、引用规则或显式豁免
- 进入任务后继续读取 `rules/code-style.md` 和 `docs/AI-ENGINEERING-PLAYBOOK.md`
- 修改 AI 入口后运行 `node scripts/ci/check-ai-governance.mjs`

### 4. GitHub Copilot
**配置文件**: `.github/copilot-instructions.md`

GitHub Copilot 使用仓库级 instructions 薄入口，继续转发到 `AGENTS.md`、`CLAUDE.md`、`rules/code-style.md` 和 `docs/AI-ENGINEERING-PLAYBOOK.md`。

**使用方式**:
- Copilot Chat / agent 任务先读取 `.github/copilot-instructions.md`
- 入口文件只保留关键路由和边界，不复制完整规则
- 修改 Copilot 入口后运行 `node scripts/ci/check-ai-governance.mjs`

## 文件说明

### CLAUDE.md
**目标用户**: Claude Code 等对话式 AI 助手

**内容包括**:
- 项目背景和目标
- 详细的目录结构
- 每个模块的功能说明
- 开发规范和最佳实践
- 常见任务的分步指引
- 故障排查和问题解决
- 测试和部署指南

**特点**:
- 详细且结构化
- 包含大量示例代码
- 提供明确的操作步骤
- 适合需要深度理解项目的 AI 助手

### .cursorrules / .cursor/rules/**/*.mdc
**目标用户**: Cursor AI

**内容包括**:
- 主规范和 Playbook 的入口引用
- 版本 / CHANGELOG、子 Agent 委派、AI 修复安全边界和规则进化闭环
- 发布、旧 chunk 和公网资源巡检命令

**特点**:
- 薄入口，不复制完整规范
- 由 `check-ai-governance` 锁定关键引用

### docs/AI-ENGINEERING-PLAYBOOK.md
**目标用户**: Claude Code、Codex、Cursor 等 AI 编程助手

**内容包括**:
- 必读文件顺序
- 性能、重构、后端和部署改动的验证方式
- AI 资产维护清单
- 修改代码后的收尾检查

**特点**:
- 跨工具共享
- 强调可验证闭环
- 适合长期维护和交接

### docs/AI-CONFIG-INTEGRATION.md
**目标用户**: 维护 AI 入口、rules、skills 和本机配置边界的开发者与 AI 助手

**内容包括**:
- AI 协作资产分层
- 权威规范与工具薄入口关系
- 本机私有配置和显式豁免边界
- `docs/AI-*.md` 进入治理网的维护流程

### docs/AI-TOOLS-SETUP.md
**目标用户**: 需要快速确认当前 AI 工具入口和防漂移清单的维护者

**内容包括**:
- 当前 AI 工具入口状态
- 必读顺序和维护要求
- 必跑治理命令
- 防漂移清单

### docs/AI-ASSET-REGISTRY.md
**目标用户**: 维护 AI 协作资产、治理门禁和显式豁免边界的开发者与 AI 助手

**内容包括**:
- 关键 AI 协作入口和权威规则
- 工具薄入口和可迁移 skill
- 本机私有配置的显式豁免理由
- 治理门禁和更新流程

## 使用建议

### 对于 AI 助手
1. **优先阅读规则文件**
   - 在编写代码前先阅读相应的配置文件
   - 理解项目的代码风格和规范
   - 遵循已有的架构模式

2. **参考现有代码**
   - 查看类似功能的现有实现
   - 保持代码风格一致
   - 复用已有的组件和工具函数

3. **测试驱动**
   - 修改代码后进行本地测试
   - 确保类型检查通过
   - 验证功能是否正常工作
   - 有子 Agent 委派时，主线程负责复核关键证据、合并修改和补齐最终门禁

### 对于开发者
1. **保持文件更新**
   - 重大架构变更后更新 `CLAUDE.md`
   - 新增规范及时更新 `.cursorrules` 或 `.cursor/rules/**/*.mdc`
   - 确保文档与实际代码一致

2. **反馈和改进**
   - AI 生成的代码如果不符合规范，及时调整规则文件
   - 发现新的最佳实践，添加到文档中
   - 记录常见问题和解决方案
   - 对重复踩坑、用户纠偏、验证缺口做复盘沉淀，并完成规则/skill 回写
- 规则进化后运行 `node scripts/ci/check-ai-governance.mjs` 做治理校验，确认入口文档和项目级 skill 契约没有漂移
- 入口、Playbook、rules 或 skill 变更后运行 `node scripts/ci/check-maintainability-budgets.mjs`，确认新增治理 helper 和测试都有预算所有权
- 新增 `.codex/config.toml`、`.mcp.json`、`.cursor/mcp.json` 或 `.vscode/mcp.json` 时按项目级 MCP 配置处理，先同步资产注册表、引用规则或显式豁免；不要递归纳入整个 `.cursor` 或 `.vscode` 目录

3. **版本控制**
   - 规则文件纳入 Git 版本控制
   - 重要变更在 commit message 中说明
   - 团队成员同步最新规则

## 文档结构对比

| 特性 | CLAUDE.md / AGENTS.md | .cursorrules | AI Playbook |
|------|---------------------|--------------|-------------|
| **详细程度** | 非常详细 | 简洁规范 | 中等，偏流程 |
| **目标场景** | 对话式理解和任务执行 | 实时代码建议 | 跨 AI 工具闭环 |
| **内容组织** | 教程式，分步骤 | 规则式，快速查找 | 验证清单式 |
| **示例代码** | 大量示例 | 关键示例 | 命令和门禁 |
| **更新频率** | 架构变更时 | 规范变更时 | 流程和门禁变化时 |

## 最佳实践

### 编写 AI 规则文件的原则

1. **清晰且具体**
   - 避免模糊的描述
   - 提供具体的示例
   - 说明"为什么"而不只是"怎么做"

2. **结构化组织**
   - 使用清晰的层级结构
   - 相关内容分组
   - 易于查找和引用

3. **保持更新**
   - 定期审查规则文件
   - 移除过时的内容
   - 添加新的最佳实践

4. **包含上下文**
   - 说明技术选型的原因
   - 解释架构决策
   - 提供相关背景信息

### 与 AI 助手协作的技巧

1. **明确意图**
   - 提供清晰的任务描述
   - 说明期望的结果
   - 指定需要遵循的规范

2. **提供上下文**
   - 引用相关的文件和代码
   - 说明修改的原因
   - 描述现有的问题

3. **迭代改进**
   - 检查 AI 生成的代码
   - 提供反馈和修正
   - 总结学到的经验

## 相关资源

- [ARCHITECTURE.md](../ARCHITECTURE.md) - 详细架构说明
- [AI 配置整合说明](../docs/AI-CONFIG-INTEGRATION.md) - AI 入口、rules、skills 和显式豁免关系
- [AI 工具配置状态](../docs/AI-TOOLS-SETUP.md) - 当前 AI 工具入口和防漂移清单
- [AI 协作资产注册表](../docs/AI-ASSET-REGISTRY.md) - AI 资产账本、治理门禁和显式豁免登记
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 贡献指南
- [CHANGELOG.md](../CHANGELOG.md) - 版本历史

---

💡 **提示**: 如有任何问题或建议，请参阅源码或相关文档，或向项目维护者反馈。
