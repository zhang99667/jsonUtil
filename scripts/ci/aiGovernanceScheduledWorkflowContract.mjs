import fs from 'node:fs';
import path from 'node:path';
import {
  collectGithubWorkflowCommands,
  collectGithubWorkflowJobBlocks,
  collectGithubWorkflowStepBlocks,
  collectOutcomeWriterAutomationWriteFailures,
  collectRequiredWorkflowCommandReachabilityFailures,
} from './aiGovernanceAutomationCommandContract.mjs';
import { collectGithubWorkflowRunBlocks } from './githubWorkflowRunBlocks.mjs';

export {
  collectOutcomeWriterAutomationWriteFailures,
  collectRequiredWorkflowCommandReachabilityFailures,
};

export const AI_GOVERNANCE_SCHEDULED_WORKFLOW = '.github/workflows/ai-governance.yml';
export const AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY = 'evals/ai-governance/github-attestation-policy.json';

export const AI_GOVERNANCE_ATTESTATION_ACTIONS = Object.freeze({
  attest: 'actions/attest@a1948c3f048ba23858d222213b7c278aabede763',
  checkout: 'actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0',
  setupNode: 'actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e',
  upload: 'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
});

export const AI_GOVERNANCE_EXPECTED_ATTESTATION_POLICY = Object.freeze({
  schemaVersion: 1,
  policyVersion: '1.0.0',
  authority: 'repository-audit-copy-only',
  evidenceScope: 'component-only',
  candidate: {
    repository: 'zhang99667/jsonUtil',
    repositoryId: 1100971908,
    repositoryOwnerId: 60920673,
    sourceRef: 'refs/heads/main',
    workflow: AI_GOVERNANCE_SCHEDULED_WORKFLOW,
    environment: 'ai-governance-attestation',
    runnerEnvironment: 'github-hosted',
    oidcIssuer: 'https://token.actions.githubusercontent.com',
    predicateType: 'https://slsa.dev/provenance/v1',
    subjectName: 'ai-governance-attestation-subject.json',
  },
  productionRequirements: {
    enabledVariable: 'AI_GOVERNANCE_ATTESTATION_ENABLED',
    externalIdentityPolicy: true,
    externalReusableWorkflow: true,
    immutableOidcSubject: true,
    protectedSourceRef: true,
    protectedEnvironment: true,
    requiredReviewer: true,
    preventSelfReview: true,
    preventAdminBypass: true,
    shaPinnedActions: true,
    signerRepository: true,
    signerWorkflow: true,
    signerDigest: true,
    sourceDigest: true,
    verifiedTimestamp: true,
    denySelfHostedRunners: true,
  },
});

const REQUIRED_COMMANDS = [
  'node scripts/ci/check-version-consistency.mjs',
  'node --test scripts/ci/*.test.mjs',
  'node --test scripts/mcp/*.test.mjs',
  'node scripts/ci/check-ai-evolution-evals.mjs',
  'node scripts/ci/check-ai-asset-distribution.mjs --head',
  'node scripts/ci/write-ai-governance-artifacts.mjs',
];

const collectUses = block => [...block.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm)].map(match => match[1]);
const missing = (block, fragments, label) => fragments
  .filter(fragment => !block.includes(fragment))
  .map(fragment => `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: ${label} 缺少 "${fragment.trim()}"`);

const collectAttestationJobFailures = (content) => {
  const jobs = collectGithubWorkflowJobBlocks(content);
  const capture = jobs.get('ai-governance') ?? '';
  const signer = jobs.get('attest-ai-governance-evidence') ?? '';
  const subjectUpload = collectGithubWorkflowStepBlocks(capture)
    .find(step => /\bid:\s*upload-attestation-subject\b/.test(step)) ?? '';
  const failures = [];
  failures.push(...missing(capture, [
    'permissions:\n      contents: read',
    'attestation-subject-digest: ${{ steps.upload-attestation-subject.outputs.artifact-digest }}',
    `uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.checkout}`,
    `uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.setupNode}`,
  ], 'capture job'));
  failures.push(...missing(subjectUpload, [
    'path: artifacts/ai-governance/ai-governance-attestation-subject.json',
    'archive: false',
    'if-no-files-found: error',
  ], 'attestation subject upload'));
  if (JSON.stringify(collectUses(subjectUpload)) !== JSON.stringify([AI_GOVERNANCE_ATTESTATION_ACTIONS.upload])) {
    failures.push(`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: attestation subject 必须由固定 SHA upload action 直接上传`);
  }
  if (/id-token:\s*write|attestations:\s*write|secrets\./.test(capture)) {
    failures.push(`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: capture job 禁止 OIDC、attestation 写权限或 secret`);
  }
  failures.push(...missing(signer, [
    'needs: ai-governance',
    "if: ${{ github.repository == 'zhang99667/jsonUtil' && github.ref == 'refs/heads/main' && vars.AI_GOVERNANCE_ATTESTATION_ENABLED == 'true' }}",
    'environment: ai-governance-attestation',
    'runs-on: ubuntu-latest',
    'permissions:\n      contents: read\n      id-token: write\n      attestations: write\n    steps:',
    'subject-name: ai-governance-attestation-subject.json',
    'subject-digest: sha256:${{ needs.ai-governance.outputs.attestation-subject-digest }}',
    'path: ${{ steps.attest.outputs.bundle-path }}',
    'archive: false',
    'if-no-files-found: error',
  ], 'signer job'));
  if (JSON.stringify(collectUses(signer)) !== JSON.stringify([
    AI_GOVERNANCE_ATTESTATION_ACTIONS.attest,
    AI_GOVERNANCE_ATTESTATION_ACTIONS.upload,
  ])) {
    failures.push(`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: signer job 只允许固定 SHA 的 actions/attest 与 bundle upload`);
  }
  if (/actions\/checkout@|^\s*run:|secrets\.|CODEX_API_KEY|GEMINI|if:\s*always\(\)/m.test(signer)) {
    failures.push(`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: signer job 禁止 checkout、run、模型凭据或 always 执行`);
  }
  return failures;
};

const collectAttestationPolicyFailures = (rootDir) => {
  try {
    const actual = JSON.parse(fs.readFileSync(path.join(rootDir, AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY), 'utf8'));
    return JSON.stringify(actual) === JSON.stringify(AI_GOVERNANCE_EXPECTED_ATTESTATION_POLICY)
      ? []
      : [`${AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY}: 必须是 component-only 审计副本并要求仓外生产 identity policy`];
  } catch (error) {
    return [`${AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY}: 无法读取（${error.message}）`];
  }
};

export const collectAiGovernanceScheduledWorkflowFailures = (rootDir) => {
  const workflowPath = path.join(rootDir, AI_GOVERNANCE_SCHEDULED_WORKFLOW);
  if (!fs.existsSync(workflowPath)) return [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 缺少定时 AI 治理 workflow`];

  const content = fs.readFileSync(workflowPath, 'utf8');
  const commands = new Set(collectGithubWorkflowCommands(content));
  return [
    ...(!/^permissions:\s*\{\}\s*$/m.test(content)
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 顶层 permissions 必须为空并逐 job 最小授权`] : []),
    ...(!/^\s*schedule:\s*$/m.test(content) || !/^\s*-\s*cron:\s*['"][^'"]+['"]\s*$/m.test(content)
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须配置 cron schedule`] : []),
    ...(!/^\s*workflow_dispatch:\s*$/m.test(content)
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须保留 workflow_dispatch 手动触发`] : []),
    ...(!/uses:\s*actions\/checkout@[^\n]+[\s\S]{0,160}fetch-depth:\s*0/.test(content)
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: checkout 必须保留完整 Git 历史`] : []),
    ...REQUIRED_COMMANDS
      .filter(command => !commands.has(command))
      .map(command => `${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 缺少定时治理命令 "${command}"`),
    ...collectOutcomeWriterAutomationWriteFailures(
      collectGithubWorkflowRunBlocks(content).map(block => block.content),
      AI_GOVERNANCE_SCHEDULED_WORKFLOW,
    ),
    ...collectRequiredWorkflowCommandReachabilityFailures(content, REQUIRED_COMMANDS, AI_GOVERNANCE_SCHEDULED_WORKFLOW),
    ...(!content.includes('uses: actions/upload-artifact@') || !content.includes('path: artifacts/ai-governance')
      ? [`${AI_GOVERNANCE_SCHEDULED_WORKFLOW}: 必须上传 AI governance artifacts`] : []),
    ...collectAttestationJobFailures(content),
    ...collectAttestationPolicyFailures(rootDir),
    ...(() => {
      const ciPath = path.join(rootDir, '.github/workflows/ci.yml');
      const ci = fs.existsSync(ciPath) ? fs.readFileSync(ciPath, 'utf8') : '';
      return /id-token:\s*write|attestations:\s*write|actions\/attest@/.test(ci)
        ? ['.github/workflows/ci.yml: pull_request CI 禁止 attestation 特权'] : [];
    })(),
  ];
};
