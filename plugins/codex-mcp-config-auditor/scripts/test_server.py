import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("server.py")
SPEC = importlib.util.spec_from_file_location("codex_mcp_config_auditor_server", MODULE_PATH)
SERVER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SERVER)


class AuditorTests(unittest.TestCase):
    def write_config(self, text: str) -> Path:
        root = Path(tempfile.mkdtemp())
        self.addCleanup(lambda: __import__("shutil").rmtree(root, ignore_errors=True))
        path = root / "config.toml"
        path.write_text(text, encoding="utf-8")
        return path

    def test_static_sensitive_header_is_reported_without_value(self):
        marker = "synthetic-value-must-never-appear"
        path = self.write_config(
            f'[mcp_servers.demo]\nurl = "https://example.invalid/mcp"\n'
            f'[mcp_servers.demo.http_headers]\nAuthorization = "{marker}"\n'
        )
        report = SERVER.audit_config(path)
        serialized = json.dumps(report)
        self.assertEqual(report["status"], "warn")
        self.assertEqual(report["findings"][0]["riskCode"], "CODEX_MCP_STATIC_SENSITIVE_HEADER")
        self.assertNotIn(marker, serialized)
        for forbidden in ["value", "hash", "length", "preview", "raw"]:
            self.assertNotIn(forbidden, report["findings"][0])

    def test_static_environment_looking_value_is_still_reported(self):
        path = self.write_config(
            '[mcp_servers.demo.http_headers]\nAuthorization = "$TOKEN_ENV"\n'
        )
        self.assertEqual(SERVER.audit_config(path)["counts"]["findings"], 1)

    def test_env_backed_headers_and_normal_metadata_are_not_findings(self):
        path = self.write_config(
            '[mcp_servers.demo]\nbearer_token_env_var = "MCP_TOKEN"\n'
            '[mcp_servers.demo.http_headers]\nX-Region = "us-east"\n'
            '[mcp_servers.demo.env_http_headers]\nX-Auth = "MCP_AUTH"\n'
        )
        report = SERVER.audit_config(path)
        self.assertEqual(report["status"], "pass")
        self.assertEqual(report["counts"], {"servers": 1, "findings": 0})

    def test_invalid_identifiers_and_parse_errors_are_redacted(self):
        marker = "server-name-must-not-appear"
        path = self.write_config(
            f'[mcp_servers."{marker} with spaces".http_headers]\nAuthorization = "x"\n'
        )
        serialized = json.dumps(SERVER.audit_config(path))
        self.assertNotIn(marker, serialized)
        broken = self.write_config("[mcp_servers\nsecret parse details")
        broken_report = json.dumps(SERVER.audit_config(broken))
        self.assertNotIn("secret parse details", broken_report)
        self.assertIn("CODEX_MCP_CONFIG_PARSE_FAILED", broken_report)

    def test_symlink_is_rejected_without_target_path(self):
        root = Path(tempfile.mkdtemp())
        self.addCleanup(lambda: __import__("shutil").rmtree(root, ignore_errors=True))
        target = root / "target.toml"
        target.write_text("", encoding="utf-8")
        link = root / "config.toml"
        link.symlink_to(target)
        report = SERVER.audit_config(link)
        self.assertEqual(report["status"], "unavailable")
        self.assertNotIn(str(target), json.dumps(report))

    def test_stdio_mcp_rejects_arguments_and_never_emits_fixture_value(self):
        with tempfile.TemporaryDirectory() as root:
            marker = "stdio-secret-must-never-appear"
            Path(root, "config.toml").write_text(
                f'[mcp_servers.demo.http_headers]\nAuthorization = "{marker}"\n',
                encoding="utf-8",
            )
            messages = [
                {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-11-25"}},
                {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
                {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "audit_codex_mcp_static_headers", "arguments": {}}},
                {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "audit_codex_mcp_static_headers", "arguments": {"debug": True}}},
            ]
            process = subprocess.run(
                [sys.executable, str(MODULE_PATH)],
                input="".join(json.dumps(item) + "\n" for item in messages),
                text=True,
                capture_output=True,
                env={**os.environ, "CODEX_HOME": root},
                check=True,
            )
            self.assertEqual(process.stderr, "")
            self.assertNotIn(marker, process.stdout)
            responses = [json.loads(line) for line in process.stdout.splitlines()]
            self.assertEqual(responses[2]["result"]["structuredContent"]["status"], "warn")
            self.assertEqual(responses[3]["error"]["code"], -32602)


if __name__ == "__main__":
    unittest.main()
