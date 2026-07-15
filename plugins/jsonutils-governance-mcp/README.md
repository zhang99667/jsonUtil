# JSONUtils 治理 MCP

这是一个由项目所有的 Codex 插件，用于注册 JSONUtils 仓库固定的只读
`jsonutils-governance` MCP 服务。

## 边界

- 插件只会相对当前项目根目录运行仓库所有的 Node MCP 入口。
- 它不转发任意命令、路径、环境变量或凭据。
- MCP 服务本身只暴露已经仓库验证的固定工具和资源。
- 插件安装只能证明注册元数据存在。新 Codex 任务仍必须实际发现并调用该 MCP，行为用例才可能通过。

## 验证

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py" \
  plugins/jsonutils-governance-mcp
node --test scripts/mcp/*.test.mjs
```
