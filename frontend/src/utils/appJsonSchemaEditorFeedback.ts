import type { EditorDiagnosticHighlight } from '../types';
import { getJsonSchemaIssueHighlights } from './jsonSchemaIssueHighlights';
import type { JsonSchemaValidationResult } from './jsonSchemaValidation';

export interface AppJsonSchemaEditorFeedback {
  diagnosticHighlights: EditorDiagnosticHighlight[];
  warning: string;
}

export const buildAppJsonSchemaEditorFeedback = (
  sourceText: string,
  result: JsonSchemaValidationResult | null,
): AppJsonSchemaEditorFeedback => {
  const diagnosticHighlights = getJsonSchemaIssueHighlights(sourceText, result)
    .map(({ range, issue }) => ({
      range,
      path: issue.path,
      keyword: issue.keyword,
      message: issue.message,
    }));

  return {
    diagnosticHighlights,
    warning: result && result.status === 'invalid'
      ? `Schema 未通过 ${result.issueCount} 个问题`
      : '',
  };
};
