export type AppSaveEditor = 'SOURCE' | 'PREVIEW' | null;

export type AppSaveShortcutPlan =
  | { action: 'skip'; reason: 'preview-transforming'; message: string }
  | { action: 'skip'; reason: 'preview-active-file-without-handle' }
  | { action: 'save-preview-to-file'; successMessage: string }
  | { action: 'save-source-to-file'; successMessage: string }
  | { action: 'save-preview-as' }
  | { action: 'save-source-as'; successMessage: string };

export type AppToolbarSavePlan =
  | { action: 'save-preview-as' }
  | { action: 'save-source-to-file'; successMessage: string }
  | { action: 'save-source-as'; successMessage: string };

export type AppSaveExecutablePlan = AppSaveShortcutPlan | AppToolbarSavePlan;
export type AppSaveEffectPlan = Exclude<AppSaveExecutablePlan, { action: 'skip' }>;

export interface AppSavePlanInput {
  activeEditor: AppSaveEditor;
  hasActiveFile: boolean;
  activeFileHasHandle?: boolean;
  isOutputTransforming?: boolean;
}
