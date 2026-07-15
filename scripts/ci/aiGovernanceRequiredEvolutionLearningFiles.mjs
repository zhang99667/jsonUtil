import { AI_GOVERNANCE_REQUIRED_REGISTRATION_CANARY_FILES } from './aiGovernanceRequiredRegistrationCanaryFiles.mjs';

export const AI_GOVERNANCE_REQUIRED_EVOLUTION_LEARNING_FILES = [
  'evals/ai-governance/feedback-inbox.jsonl',
  'evals/ai-governance/experiments.json',
  'scripts/ci/aiGovernanceRequiredEvolutionLearningFiles.mjs',
  'scripts/ci/aiGovernanceEvolutionFeedbackInbox.mjs',
  'scripts/ci/aiGovernanceEvolutionExperiments.mjs',
  'scripts/ci/aiGovernanceEvolutionLearningReport.mjs',
  'scripts/ci/aiGovernanceEvolutionSuiteReport.mjs',
  ...AI_GOVERNANCE_REQUIRED_REGISTRATION_CANARY_FILES,
  'scripts/ci/prepare-ai-evolution-feedback.mjs',
  'scripts/ci/aiGovernanceEvolutionFeedbackInbox.test.mjs',
  'scripts/ci/aiGovernanceEvolutionExperiments.test.mjs',
  'scripts/ci/aiGovernanceEvolutionSuiteReport.test.mjs',
  'scripts/ci/prepare-ai-evolution-feedback.test.mjs',
];
