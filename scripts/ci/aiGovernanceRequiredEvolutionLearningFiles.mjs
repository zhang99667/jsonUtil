import { AI_GOVERNANCE_REQUIRED_REGISTRATION_CANARY_FILES } from './aiGovernanceRequiredRegistrationCanaryFiles.mjs';
import { AI_GOVERNANCE_REQUIRED_EVOLUTION_CALIBRATION_FILES } from './aiGovernanceRequiredEvolutionCalibrationFiles.mjs';
import { AI_GOVERNANCE_REQUIRED_EVOLUTION_PAIRED_FILES } from './aiGovernanceRequiredEvolutionPairedFiles.mjs';
export const AI_GOVERNANCE_REQUIRED_EVOLUTION_LEARNING_FILES = [
  'evals/ai-governance/feedback-inbox.jsonl',
  'evals/ai-governance/experiments.json',
  'scripts/ci/aiGovernanceRequiredEvolutionLearningFiles.mjs',
  'scripts/ci/aiGovernanceEvolutionFeedbackInbox.mjs',
  'scripts/ci/aiGovernanceEvolutionExperiments.mjs',
  'scripts/ci/aiGovernanceEvolutionLearningReport.mjs',
  'scripts/ci/aiGovernanceEvolutionSuiteReport.mjs',
  ...AI_GOVERNANCE_REQUIRED_REGISTRATION_CANARY_FILES, ...AI_GOVERNANCE_REQUIRED_EVOLUTION_CALIBRATION_FILES,
  ...AI_GOVERNANCE_REQUIRED_EVOLUTION_PAIRED_FILES,
  'scripts/ci/prepare-ai-evolution-feedback.mjs',
  'scripts/ci/aiGovernanceEvolutionFeedbackInbox.test.mjs',
  'scripts/ci/aiGovernanceEvolutionFeedbackProfiles.test.mjs',
  'scripts/ci/aiGovernanceEvolutionFeedbackCompatibility.test.mjs',
  'scripts/ci/aiGovernanceEvolutionExperiments.test.mjs',
  'scripts/ci/aiGovernanceEvolutionLearningFocus.test.mjs',
  'scripts/ci/aiGovernanceEvolutionLearningReport.test.mjs',
  'scripts/ci/aiGovernanceEvolutionSuiteReport.test.mjs',
  'scripts/ci/prepare-ai-evolution-feedback.test.mjs',
];
