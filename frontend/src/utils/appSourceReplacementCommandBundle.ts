export interface AppClearSourceCommandState {
  isClearSourceConfirmOpen: boolean;
  handleRequestClearSource: () => void;
  handleConfirmClearSource: () => void;
  handleCancelClearSource: () => void;
}

export interface AppSchemeInspectSourceCommandState {
  pendingSchemeInspectSourceText: string | null;
  handleInspectSourceFromScheme: (value: string) => void;
  handleConfirmSchemeInspectSource: () => void;
  handleCancelSchemeInspectSource: () => void;
}

export interface AppPasteSourceCommandState {
  pendingPasteSourceText: string | null;
  handlePasteSource: () => Promise<void>;
  handleConfirmPasteSource: () => void;
  handleCancelPasteSource: () => void;
}

export interface AppApplySourceReplacementCommandState {
  pendingApplyPreviewText: string | null;
  pendingSchemaExampleText: string | null;
  handleRequestApplyPreviewToSource: () => void;
  handleConfirmApplyPreviewToSource: () => void;
  handleCancelApplyPreviewToSource: () => void;
  handleRequestApplySchemaExampleToSource: (text: string) => void;
  handleConfirmApplySchemaExampleToSource: () => void;
  handleCancelApplySchemaExampleToSource: () => void;
}

interface AppSourceReplacementCommandBundleInput {
  clearSourceCommands: AppClearSourceCommandState;
  schemeInspectCommands: AppSchemeInspectSourceCommandState;
  pasteCommands: AppPasteSourceCommandState;
  applyCommands: AppApplySourceReplacementCommandState;
}

export type AppSourceReplacementCommands = AppClearSourceCommandState
  & AppSchemeInspectSourceCommandState
  & AppPasteSourceCommandState
  & AppApplySourceReplacementCommandState;

export const buildAppSourceReplacementCommands = ({
  clearSourceCommands,
  schemeInspectCommands,
  pasteCommands,
  applyCommands,
}: AppSourceReplacementCommandBundleInput): AppSourceReplacementCommands => ({
  ...clearSourceCommands,
  ...schemeInspectCommands,
  ...pasteCommands,
  ...applyCommands,
});
