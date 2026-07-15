import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const AI_GOVERNANCE_ATTESTATION_SUBJECT_FILE = 'ai-governance-attestation-subject.json';

const JSON_ARTIFACTS = [
  ['governance', 'ai-governance-report.json'],
  ['evolution', 'ai-evolution-eval-report.json'],
  ['maintainability', 'maintainability-budget-report.json'],
  ['context', 'jsonutils-governance-context.json'],
  ['scorecard', 'ai-governance-scorecard.json'],
];
const LEDGER_FILES = [
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
];

const sha256 = value => createHash('sha256').update(value).digest('hex');
const jsonBytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');

export const buildAiGovernanceAttestationSubject = ({ rootDir, generatedAt, artifacts }) => ({
  schemaVersion: 1,
  artifactType: 'ai-governance-attestation-subject',
  evidenceScope: 'component-only',
  generatedAt,
  digestAlgorithm: 'sha256',
  artifacts: [
    ...JSON_ARTIFACTS.map(([id, name]) => ({
      name,
      sha256: sha256(jsonBytes(artifacts[id])),
    })),
    {
      name: 'summary.md',
      sha256: sha256(Buffer.from(artifacts.summary, 'utf8')),
    },
  ],
  ledgers: LEDGER_FILES.map(name => ({
    name,
    sha256: sha256(fs.readFileSync(path.join(rootDir, name))),
  })),
  trustBoundary: {
    status: 'external-identity-required',
    policyAuthority: 'repository-external',
    confirmedCoverageEligible: false,
  },
});
