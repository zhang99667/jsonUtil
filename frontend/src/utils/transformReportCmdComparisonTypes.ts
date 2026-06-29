import type { JsonValue } from '../types';
import type {
  CmdStructureCandidateInput,
  RankedCmdStructureCandidate,
} from './cmdStructureDiff';

export interface CmdComparisonCandidateInput extends CmdStructureCandidateInput {
  recordPath: string;
}

export interface RankedCmdComparisonCandidate extends RankedCmdStructureCandidate {
  actual: JsonValue;
  recordPath: string;
}

export interface CmdComparisonDiffSummary {
  hasDifferences: boolean;
  missingLabel: string;
  extraLabel: string;
  ignoredExtraLabel: string;
  valueDiffCount: number;
  hasSchemaDiff: boolean;
  hasSourceDiff: boolean;
  previewLines: string[];
}

export interface CmdComparisonPanelState {
  diffReportText: string;
  diffSummary: CmdComparisonDiffSummary | null;
  errorText: string;
  candidateRecommendations: RankedCmdComparisonCandidate[];
}
