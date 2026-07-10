import { buildJsonutilsGovernanceProjectSummary } from './jsonutils-governance-project-summary.mjs';
import { buildJsonutilsGovernanceReportSummary } from './jsonutils-governance-report-summary.mjs';

const JSON_CONTEXT_SCHEMA_VERSION = 1;

export const buildJsonutilsGovernanceContextFromReports = ({
  rootDir,
  top = 5,
  governanceReport,
  budgetReport,
}) => {
  const project = buildJsonutilsGovernanceProjectSummary(rootDir);
  const reportSummary = buildJsonutilsGovernanceReportSummary({ governanceReport, budgetReport, top });

  return {
    schemaVersion: JSON_CONTEXT_SCHEMA_VERSION,
    reportType: 'jsonutils-governance-context',
    ok: governanceReport.ok === true && budgetReport.ok === true,
    project: {
      name: project.name,
      version: project.version,
      changelog: project.changelog,
      latestDecision: project.latestDecision,
    },
    ...reportSummary,
  };
};
