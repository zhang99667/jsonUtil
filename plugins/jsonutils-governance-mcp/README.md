# JSONUtils Governance MCP

Project-owned Codex plugin that registers the JSONUtils repository's fixed, read-only
`jsonutils-governance` MCP server.

## Boundary

- The plugin runs only the repository-owned Node MCP entrypoint relative to the active project root.
- The manifest's `mcpServers` field points to `.mcp.json`; that companion uses the official direct server-map shape.
- It does not forward arbitrary commands, paths, environment variables, or credentials.
- The MCP server itself exposes only the fixed tools and resources validated by the repository.
- Plugin installation proves registration metadata only. A new Codex task must still discover and
  call the MCP before the behavior case can pass.

## Validation

```bash
node --test scripts/ci/aiGovernanceProjectPlugins.test.mjs scripts/mcp/*.test.mjs
```
