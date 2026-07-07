# AI 工具配置说明

本项目已为主流 AI 编程助手配置了必要的规则和上下文文件。

## 支持的 AI 工具

### 1. Claude Code / Ducc
**配置文件**: `CLAUDE.md`

Claude Code (Anthropic) 和 Ducc (百度) 的项目指引文件，包含:
- 完整的项目结构说明
- 技术栈详情
- 代码规范和最佳实践
- 常见任务指引
- 故障排查指南

**使用方式**:
- Claude Code 会自动读取 `CLAUDE.md` 文件
- 文件内容会被用作项目上下文
- 提供更准确的代码建议和修复方案

### 2. Codex / OpenAI Coding Agent
**配置文件**: `AGENTS.md`、`.codex/skills/jsonutils-maintainer/SKILL.md`

Codex 使用 `AGENTS.md` 作为项目入口，并可参考 `.codex/skills/` 中的项目维护技能模板。

**使用方式**:
- 开始任务前读取 `AGENTS.md` 和 `rules/code-style.md`
- 性能优化、重构、Scheme/CMD 解析改动参考 `docs/AI-ENGINEERING-PLAYBOOK.md`
- 部署 shell、本地 CI、GitHub shell helper 或 `.github/workflows/*.yml` 的 `workflow run` 块改动后运行 `node scripts/ci/check-deploy-shell-syntax.mjs`，覆盖外层脚本、内联 run 和 `REMOTE_SCRIPT heredoc` 远端片段
- 手动懒加载 `import()`、相关 catch 或 `dispatchChunkLoadRecoveryEvent` 改动后运行 `node scripts/ci/check-chunk-load-recovery-catches.mjs`，避免旧 chunk 加载失败被业务 catch 吞掉
- 前端 Docker、Compose、Nginx 或静态资源发布改动后运行 `node scripts/ci/check-frontend-static-retention.mjs`
- 公网发布后运行 `node scripts/ci/check-production-frontend-assets.mjs <baseUrl>`，确认当前入口声明的懒加载 chunk、CSS `url(...)` 二级资源和 CSS `@import` 链路可访问，并校验 JS/CSS `Content-Type` 没有被 fallback 成 HTML 伪装成成功
- 用户反馈旧 chunk URL 时，给公网资源巡检追加 `--extra-asset <url-or-path>` 纳入同一轮 404 和 MIME 诊断
- 跨模块排查、复杂重构或多条验证链路并行时按 Playbook 做子 Agent 委派判断；主线程负责拆分边界、整合证据和最终验证
- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环
- 需要迁移到本机 Codex skills 时，可复制 `.codex/skills/jsonutils-maintainer/SKILL.md`

### 3. Cursor AI
**配置文件**: `.cursorrules`

Cursor AI 的规则文件，定义了:
- 代码风格规范
- Git 提交规范
- API 设计约定
- 测试指南
- 常见问题解决方案

**使用方式**:
- Cursor 会自动读取 `.cursorrules` 文件
- 规则会应用到所有代码生成和建议中
- 确保生成的代码符合项目规范

### 4. GitHub Copilot
**配置文件**: 无需特殊配置

GitHub Copilot 会根据:
- 项目中的现有代码模式
- 注释和文档
- 文件结构和命名

自动学习并提供建议。

**优化建议**:
- 为关键函数添加清晰的注释
- 保持代码风格一致
- 使用有意义的变量和函数名

### 5. Comate (百度代码助手)
**配置文件**: `.comate/` 目录

项目中已有 `.comate/` 目录配置。

**使用方式**:
- Comate 会读取 `.comate/` 目录下的配置
- 参考 `CLAUDE.md` 中的规范进行开发

## 文件说明

### CLAUDE.md
**目标用户**: Claude Code、Ducc 等对话式 AI 助手

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

### .cursorrules
**目标用户**: Cursor AI

**内容包括**:
- 简洁的技术栈说明
- 代码规范 (TypeScript、React、Java)
- 命名约定和文件结构
- Git 提交规范
- API 设计模式
- 性能优化建议
- 安全注意事项

**特点**:
- 紧凑且规范化
- 侧重具体的编码规则
- 包含反例和正例对比
- 快速参考手册风格

### docs/AI-ENGINEERING-PLAYBOOK.md
**目标用户**: Claude Code、Codex、Ducc、Cursor 等所有 AI 编程助手

**内容包括**:
- 必读文件顺序
- 性能、重构、后端和部署改动的验证方式
- AI 资产维护清单
- 修改代码后的收尾检查

**特点**:
- 跨工具共享
- 强调可验证闭环
- 适合长期维护和交接

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
   - 新增规范及时更新 `.cursorrules`
   - 确保文档与实际代码一致

2. **反馈和改进**
   - AI 生成的代码如果不符合规范，及时调整规则文件
   - 发现新的最佳实践，添加到文档中
   - 记录常见问题和解决方案
   - 对重复踩坑、用户纠偏、验证缺口做复盘沉淀，并完成规则/skill 回写
   - 规则进化后运行 `node scripts/ci/check-ai-governance.mjs` 做治理校验

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

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 详细架构说明
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南
- [CHANGELOG.md](./CHANGELOG.md) - 版本历史

---

## 更新记录

- **2025-02-25**: 创建 AI 工具配置说明文档
- 添加 `CLAUDE.md` - Claude Code/Ducc 指引
- 添加 `.cursorrules` - Cursor AI 规则
- 说明各 AI 工具的使用方式和最佳实践
- **2026-06-28**: 补充 Codex 项目级 skill 和 AI 工程协作 Playbook，统一跨工具验证闭环
- **2026-07-01**: 补充子 Agent 委派说明，明确主线程整合职责和复杂任务拆分边界
- **2026-07-07**: 补充 AI 修复安全边界，要求本地规则优先、手动触发、敏感内容不外泄和可验证闭环
- **2026-07-07**: 补充规则进化闭环，要求复盘沉淀、规则/skill 回写和治理校验同步完成

---

💡 **提示**: 如有任何问题或建议，请参阅源码或相关文档，或向项目维护者反馈。
