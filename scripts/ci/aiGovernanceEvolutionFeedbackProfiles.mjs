const defineProfile = ({
  id, schemaVersion, caseId, experimentId, evidenceCode, surface, scope, signalPrefix,
}) => Object.freeze({
  id,
  schemaVersion,
  caseId,
  experimentId,
  evidence: Object.freeze({ code: evidenceCode, surface, scope }),
  signalPrefix,
});

const profiles = [
  defineProfile({
    id: 'mcp-server-unregistered',
    schemaVersion: 1,
    caseId: 'mcp-project-registration-discovery',
    experimentId: 'mcp-project-registration-canary',
    evidenceCode: 'unknown-mcp-server',
    surface: 'codex-task-registry',
    scope: 'self-observed-unverified',
    signalPrefix: 'mcp-project-registration-unavailable',
  }),
  defineProfile({
    id: 'skill-behavior-channel-missing',
    schemaVersion: 2,
    caseId: 'skill-jsonutils-ai-infra-evolver-trigger',
    experimentId: 'skill-evolver-fresh-context-paired',
    evidenceCode: 'behavior-evidence-channel-missing',
    surface: 'skill-trigger-eval',
    scope: 'repository-audit',
    signalPrefix: 'skill-evolver-behavior-channel-missing',
  }),
  defineProfile({
    id: 'maintainer-correction',
    schemaVersion: 3,
    caseId: null,
    experimentId: null,
    evidenceCode: 'project-maintainer-correction',
    surface: 'project-collaboration',
    scope: 'case-bound-redacted',
    signalPrefix: 'maintainer-correction',
  }),
];

const profilesById = new Map(profiles.map(profile => [profile.id, profile]));
const profilesByEvidenceCode = new Map(profiles.map(profile => [profile.evidence.code, profile]));

export const AI_EVOLUTION_FEEDBACK_PROFILE_IDS = Object.freeze(profiles.map(profile => profile.id));

export const getEvolutionFeedbackProfile = profileId => profilesById.get(profileId) ?? null;

export const getEvolutionFeedbackProfileByEvidenceCode = evidenceCode => (
  profilesByEvidenceCode.get(evidenceCode) ?? null
);
