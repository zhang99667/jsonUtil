#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyCodexExternalControllerAttestedPreflight } from './aiGovernanceCodexExternalControllerAttestedPreflight.mjs';
import { loadExternalControllerRuntimePolicyPathCandidate } from './aiGovernanceCodexExternalControllerRuntimePolicy.mjs';

const MAX_STDIN_BYTES = 1024 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REQUEST_FIELDS = ['schemaVersion', 'requestType', 'reportJson', 'hostEnvelopeJson', 'witnessEnvelopeJson', 'expectedBindings'];

const parseArgs = (argv) => {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!['--policy', '--policy-sha256'].includes(flag) || value === undefined
      || Object.hasOwn(values, flag)) throw new TypeError('external preflight 参数非法');
    values[flag] = value;
  }
  if (Object.keys(values).length !== 2 || !path.isAbsolute(values['--policy'] ?? '')
    || !SHA256_PATTERN.test(values['--policy-sha256'] ?? '')) {
    throw new TypeError('external preflight 参数非法');
  }
  return { policyPath: values['--policy'], expectedPolicySha256: values['--policy-sha256'] };
};

const readBoundedStdin = () => {
  const chunks = [];
  let total = 0;
  const buffer = Buffer.allocUnsafe(64 * 1024);
  while (true) {
    const bytes = fs.readSync(0, buffer, 0, buffer.length, null);
    if (bytes === 0) break;
    total += bytes;
    if (total > MAX_STDIN_BYTES) throw new TypeError('external preflight stdin 超限');
    chunks.push(Buffer.from(buffer.subarray(0, bytes)));
  }
  return Buffer.concat(chunks, total).toString('utf8');
};

const parseRequest = (json) => {
  let request;
  try { request = JSON.parse(json); } catch { throw new TypeError('external preflight request 非法'); }
  if (json !== JSON.stringify(request) || !request || typeof request !== 'object'
    || Array.isArray(request) || Object.keys(request).length !== REQUEST_FIELDS.length
    || REQUEST_FIELDS.some(field => !Object.hasOwn(request, field))
    || request.schemaVersion !== 1
    || request.requestType !== 'jsonutils-external-controller-attested-preflight-verification') {
    throw new TypeError('external preflight request 非法');
  }
  return request;
};

try {
  const options = parseArgs(process.argv.slice(2));
  const policy = loadExternalControllerRuntimePolicyPathCandidate({ ...options, repositoryRoot: ROOT_DIR });
  const request = parseRequest(readBoundedStdin());
  const verification = verifyCodexExternalControllerAttestedPreflight({ ...request, policy });
  process.stdout.write(`${JSON.stringify(verification)}\n`);
  process.exitCode = verification.registrationPreflightEligible ? 0 : 2;
} catch {
  process.stderr.write('{"schemaVersion":1,"reportType":"codex-external-controller-attested-runtime-preflight-error","error":"external-preflight-verification-failed"}\n');
  process.exitCode = 1;
}
