import { formatByteSize } from './documentStats';

export type {
  StatusBarBadgeState,
  StatusBarSaveStatusInput,
  StatusBarSourceValidationInput,
  StatusBarSourceValidationLocation,
} from './statusBarStateTypes';
export { STATUS_BAR_MODE_LABELS } from './statusBarModeLabels';
export { getStatusBarSaveStatus } from './statusBarSaveStatus';
export { getStatusBarSourceValidationStatus } from './statusBarSourceValidationState';

export const getStatusBarByteSizeText = (
  activeContentByteLength: number,
  isStatsLimited: boolean,
): string => `${isStatsLimited ? '≥' : ''}${formatByteSize(activeContentByteLength)}`;
