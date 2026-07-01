import type { AppVersionMetadata } from './appVersion';
import type { TransformSuggestedCommand } from './transformSuggestedCommands';

export interface TransformTroubleshootingRecipeStep {
  id: string;
  label: string;
  action: string;
  description: string;
  input: string;
  output: string;
  dependsOn: string[];
  enabled: boolean;
}

export interface TransformTroubleshootingRecipe {
  schemaVersion: 1;
  kind: 'json-helper-transform-troubleshooting-recipe';
  tool: AppVersionMetadata;
  filter: string;
  safety: {
    containsRawResponse: false;
    containsOriginalValues: false;
    notes: string[];
  };
  summary: {
    coverageLabel: string;
    coverageScore: number;
    records: number;
    cmdStructures: number;
    nestedCommandFields: number;
    nestedResourceFields: number;
    runtimePlaceholders: number;
    unresolved: number;
    warnings: number;
    truncated: boolean;
  };
  steps: TransformTroubleshootingRecipeStep[];
  suggestedCommands: TransformSuggestedCommand[];
}
