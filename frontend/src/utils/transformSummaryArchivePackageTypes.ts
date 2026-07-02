import type { AppVersionMetadata } from './appVersion';
import type { TransformSuggestedCommand } from './transformSuggestedCommands';
import type { TransformIssueSampleExport } from './transformSummaryIssueSampleTypes';
import type { TransformPlaceholderFillTemplate } from './transformSummaryPlaceholderFillTypes';
import type { TransformQualitySnapshot } from './transformSummaryQualitySnapshotTypes';

export interface TransformCollaborationReportOptions {
  cmdComparisonReportText?: string;
  cmdComparisonCandidateText?: string;
}

export interface TransformArchivePackageOptions extends TransformCollaborationReportOptions {
  sampleName?: string;
}

export interface TransformArchivePackage {
  schemaVersion: 1;
  kind: 'json-helper-transform-archive-package';
  tool: AppVersionMetadata;
  filter: string;
  safety: {
    containsRawResponse: false;
    issueSampleOriginalValues: 'omitted-or-redacted';
    placeholderSourcePreviews: false;
    cmdComparisonMayContainValues: boolean;
    notes: string[];
  };
  artifacts: {
    diagnosticSummaryText: string;
    collaborationReportText: string;
    qualitySnapshot: TransformQualitySnapshot;
    issueSamples: TransformIssueSampleExport | null;
    placeholderFillTemplate: TransformPlaceholderFillTemplate | null;
    cmdComparisonReportText?: string;
    cmdComparisonCandidateText?: string;
  };
  suggestedCommands: TransformSuggestedCommand[];
  corpusCandidate: {
    recommendedFiles: string[];
    checklist: string[];
  };
}
