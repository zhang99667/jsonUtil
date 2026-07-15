# Codex MCP 配置审计器

这是一个由项目所有、在本地执行的 Codex 插件，用于审计当前用户固定 Codex 配置路径中的 `mcp_servers.*.http_headers`。

仓库拥有源码、清单、测试和发布策略。用户安装或缓存只是派生的运行时副本，永远不是权威源。

MCP 工具只返回有界的服务器标识符、字段路径、风险码和固定修复文本。它绝不返回配置值、哈希、长度、预览、原始 TOML 错误、环境值或配置的绝对路径。

发现契约 `0.1.0` 故意只覆盖敏感的静态 HTTP 头名；项目插件版本为 `0.2.1`。`env_http_headers`、`bearer_token_env_var`、OAuth 状态、模型提供方、命令参数和环境值不在第一版发现面内。

运行以下命令执行合成测试：

```bash
python3 -B -m unittest discover -s scripts -p 'test_*.py'
```
