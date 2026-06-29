import type {
  TransformReportIssueTriageAction,
  TransformReportNextAction,
} from './transformReportActionItemTypes';

type ActionEffect = () => void | Promise<void>;

export interface TransformReportActionRunnerDependencies {
  setQuery: (query: string) => void;
  openFirstCmdComparison: ActionEffect;
  openPlaceholderFillTemplate: ActionEffect;
  copyArchivePackage: ActionEffect;
  copyCollaborationReport: ActionEffect;
  copyQualitySnapshot: ActionEffect;
}

export interface TransformReportActionRunners {
  runIssueTriageAction: (action: TransformReportIssueTriageAction) => void;
  runNextAction: (action: TransformReportNextAction) => void;
}

export const buildTransformReportActionRunners = (
  dependencies: TransformReportActionRunnerDependencies
): TransformReportActionRunners => {
  const issueTriageHandlers: Record<TransformReportIssueTriageAction, ActionEffect> = {
    'filter-warning': () => { dependencies.setQuery('跳过'); },
    'filter-unresolved': () => { dependencies.setQuery('待检查'); },
    'open-placeholder-fill': dependencies.openPlaceholderFillTemplate,
    'filter-placeholder': () => { dependencies.setQuery('占位符'); },
  };
  const nextActionHandlers: Record<TransformReportNextAction, ActionEffect> = {
    'compare-cmd': dependencies.openFirstCmdComparison,
    'open-placeholder-fill': dependencies.openPlaceholderFillTemplate,
    'filter-placeholder': () => { dependencies.setQuery('占位符'); },
    'filter-triage': () => { dependencies.setQuery('待处理'); },
    'copy-archive': dependencies.copyArchivePackage,
    'copy-collaboration': dependencies.copyCollaborationReport,
    'copy-quality-snapshot': dependencies.copyQualitySnapshot,
  };

  return {
    runIssueTriageAction: action => { void issueTriageHandlers[action](); },
    runNextAction: action => { void nextActionHandlers[action](); },
  };
};
