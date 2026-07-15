#!/usr/bin/env python3

import json
import os
import re
import stat
import sys
import tomllib
from pathlib import Path

SERVER_VERSION = "0.1.0"
MAX_CONFIG_BYTES = 1024 * 1024
MAX_LINE_BYTES = 1024 * 1024
SAFE_IDENTIFIER = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
SENSITIVE_HEADER = re.compile(
    r"(?:authorization|proxy-authorization|cookie|x-api-key|api[_-]?key|token|secret|password|credential)",
    re.IGNORECASE,
)

REMEDIATIONS = {
    "CODEX_MCP_STATIC_SENSITIVE_HEADER": (
        "Remove the static header and use env_http_headers, bearer_token_env_var, or OAuth."
    ),
    "CODEX_MCP_CONFIG_UNAVAILABLE": "Restore a readable regular Codex config file and retry the value-free audit.",
    "CODEX_MCP_CONFIG_PARSE_FAILED": "Repair the Codex TOML configuration and retry the value-free audit.",
}


def _safe_identifier(value: object, fallback: str) -> str:
    return value if isinstance(value, str) and SAFE_IDENTIFIER.fullmatch(value) else fallback


def _finding(server: str, field_path: str, risk_code: str) -> dict:
    return {
        "server": server,
        "fieldPath": field_path,
        "riskCode": risk_code,
        "remediation": REMEDIATIONS[risk_code],
    }


def _config_path() -> Path:
    configured_home = os.environ.get("CODEX_HOME")
    if configured_home and os.path.isabs(configured_home):
        return Path(configured_home) / "config.toml"
    return Path.home() / ".codex" / "config.toml"


def _base_report(status: str, servers: int, findings: list[dict]) -> dict:
    return {
        "schemaVersion": 1,
        "reportType": "codex-mcp-static-header-audit",
        "ok": status == "pass",
        "status": status,
        "scope": "mcp_servers-static-sensitive-header-names-v1",
        "counts": {"servers": servers, "findings": len(findings)},
        "findings": findings,
        "privacy": {
            "valuesReturned": False,
            "hashesReturned": False,
            "lengthsReturned": False,
            "previewsReturned": False,
            "rawErrorsReturned": False,
            "environmentValuesRead": False,
        },
    }


def audit_config(config_path: Path | None = None) -> dict:
    path = config_path or _config_path()
    try:
        metadata = path.lstat()
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > MAX_CONFIG_BYTES:
            return _base_report(
                "unavailable",
                0,
                [_finding("<config>", "config", "CODEX_MCP_CONFIG_UNAVAILABLE")],
            )
        with path.open("rb") as handle:
            config = tomllib.load(handle)
    except (OSError, tomllib.TOMLDecodeError):
        return _base_report(
            "unavailable",
            0,
            [_finding("<config>", "config", "CODEX_MCP_CONFIG_PARSE_FAILED")],
        )

    servers = config.get("mcp_servers")
    if not isinstance(servers, dict):
        servers = {}
    findings = []
    for index, (server_name, server) in enumerate(sorted(servers.items()), start=1):
        safe_server = _safe_identifier(server_name, f"<server-{index}>")
        if not isinstance(server, dict):
            continue
        headers = server.get("http_headers")
        if not isinstance(headers, dict):
            continue
        for header_index, header_name in enumerate(sorted(headers), start=1):
            if not isinstance(header_name, str) or not SENSITIVE_HEADER.search(header_name):
                continue
            safe_header = _safe_identifier(header_name, f"<header-{header_index}>")
            findings.append(_finding(
                safe_server,
                f"mcp_servers.{safe_server}.http_headers.{safe_header}",
                "CODEX_MCP_STATIC_SENSITIVE_HEADER",
            ))
    status = "pass" if not findings else "warn"
    return _base_report(status, len(servers), findings)


TOOL = {
    "name": "audit_codex_mcp_static_headers",
    "title": "Audit Codex MCP static sensitive headers",
    "description": "Value-free audit of sensitive static HTTP header names in the fixed user Codex config.",
    "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
    "outputSchema": {
        "type": "object",
        "required": ["schemaVersion", "reportType", "ok", "status", "scope", "counts", "findings", "privacy"],
        "properties": {
            "schemaVersion": {"type": "integer", "const": 1},
            "reportType": {"type": "string", "const": "codex-mcp-static-header-audit"},
            "ok": {"type": "boolean"},
            "status": {"type": "string", "enum": ["pass", "warn", "unavailable"]},
            "scope": {"type": "string", "const": "mcp_servers-static-sensitive-header-names-v1"},
            "counts": {
                "type": "object",
                "required": ["servers", "findings"],
                "properties": {"servers": {"type": "integer"}, "findings": {"type": "integer"}},
                "additionalProperties": False,
            },
            "findings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["server", "fieldPath", "riskCode", "remediation"],
                    "properties": {
                        "server": {"type": "string"},
                        "fieldPath": {"type": "string"},
                        "riskCode": {"type": "string"},
                        "remediation": {"type": "string"},
                    },
                    "additionalProperties": False,
                },
            },
            "privacy": {
                "type": "object",
                "required": ["valuesReturned", "hashesReturned", "lengthsReturned", "previewsReturned", "rawErrorsReturned", "environmentValuesRead"],
                "properties": {
                    "valuesReturned": {"type": "boolean", "const": False},
                    "hashesReturned": {"type": "boolean", "const": False},
                    "lengthsReturned": {"type": "boolean", "const": False},
                    "previewsReturned": {"type": "boolean", "const": False},
                    "rawErrorsReturned": {"type": "boolean", "const": False},
                    "environmentValuesRead": {"type": "boolean", "const": False},
                },
                "additionalProperties": False,
            },
        },
        "additionalProperties": False,
    },
    "annotations": {
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
}


def _error(request_id: object, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def handle_message(message: object) -> dict | None:
    if not isinstance(message, dict) or message.get("jsonrpc") != "2.0" or not isinstance(message.get("method"), str):
        return _error(message.get("id") if isinstance(message, dict) else None, -32600, "Invalid Request")
    request_id = message.get("id")
    method = message["method"]
    if request_id is None:
        return None
    if method == "initialize":
        requested = message.get("params", {}).get("protocolVersion")
        protocol = requested if requested in {"2025-06-18", "2025-11-25"} else "2025-11-25"
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": protocol,
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": "codex-mcp-config-auditor", "version": SERVER_VERSION},
            },
        }
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": request_id, "result": {"tools": [TOOL]}}
    if method == "tools/call":
        params = message.get("params")
        if not isinstance(params, dict) or params.get("name") != TOOL["name"] or params.get("arguments", {}) != {}:
            return _error(request_id, -32602, "Invalid params")
        report = audit_config()
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(report, ensure_ascii=False, separators=(",", ":"))}],
                "structuredContent": report,
                "isError": False,
            },
        }
    return _error(request_id, -32601, "Method not found")


def main() -> None:
    for raw_line in sys.stdin.buffer:
        if len(raw_line) > MAX_LINE_BYTES:
            response = _error(None, -32700, "Parse error")
        else:
            try:
                response = handle_message(json.loads(raw_line))
            except (UnicodeDecodeError, json.JSONDecodeError):
                response = _error(None, -32700, "Parse error")
            except Exception:
                response = _error(None, -32603, "Internal error")
        if response is not None:
            sys.stdout.write(json.dumps(response, ensure_ascii=False, separators=(",", ":")) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
