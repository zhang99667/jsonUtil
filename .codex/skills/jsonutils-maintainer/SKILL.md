---
name: jsonutils-maintainer
description: JSONUtils 项目维护技能。用于优化性能、重构可维护性较差的模块、补充 Scheme/CMD 解析能力、维护前后端测试门禁、更新 AI 协作规范和部署排查流程。
---

# JSONUtils Maintainer

在 JSONUtils 项目中进行代码修改时使用。本技能依赖仓库内规则文件，不替代它们。

## 必读文件

1. `AGENTS.md`: Codex 项目入口和模块说明。
2. `rules/code-style.md`: 代码风格、提交格式和 CHANGELOG 要求。
3. `docs/AI-ENGINEERING-PLAYBOOK.md`: AI 自闭环执行流程。
4. 与任务相关的源码、测试和文档。

## 工作流

1. 先执行 `git status --short --branch`，确认工作树是否干净。
2. 用 `rg` 或 `rg --files` 定位相关实现和测试。
3. 明确成功标准：性能预算、解析 corpus、类型检查、构建门禁或交互测试。
4. 做最小可验证改动，不做无关大重构。
5. 更新 `CHANGELOG.md` 当前版本区块。
6. 运行匹配范围的验证命令，并在最终回复中说明结果。

## 常用验证命令

```bash
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-maintainability-budgets.mjs
```

```bash
cd frontend
npm run lint
npm run typecheck
npm run test -- src/utils/schemeUtils.test.ts
npm run corpus:scheme
npm run perf:scheme
npm run build
npm run check:preloads
```

```bash
cd backend
mvn test
```

## 重点边界

- Scheme/CMD 解析要保护 URL 编码、JSON 字符串转义、base64、JWT、嵌套 query、普通 HTTP(S) URL 的区分。
- 首屏性能优化要用构建产物和 preload 检查证明，不凭感觉判断。
- 大输入处理优先走 worker、采样、预算和降级提示。
- AI 修复能力必须明确本地规则优先、用户手动触发、敏感内容不外泄。
