# Codex MCP Config Auditor

Project-owned, locally executed Codex plugin that audits `mcp_servers.*.http_headers` in the current user's fixed Codex configuration path.

The repository owns the source, manifest, tests, and release policy. A user installation or cache is only a derived runtime copy and is never the source of truth.

The MCP tool returns only bounded server identifiers, field paths, risk codes, and fixed remediation text. It never returns configuration values, hashes, lengths, previews, raw TOML errors, environment values, or the absolute config path.

Finding contract `0.1.0` intentionally covers sensitive static HTTP header names only; the project plugin release is `0.2.1`. `env_http_headers`, `bearer_token_env_var`, OAuth state, model providers, command arguments, and environment values are outside the v1 finding surface.

Run synthetic tests with:

```bash
python3 -B -m unittest discover -s scripts -p 'test_*.py'
```
