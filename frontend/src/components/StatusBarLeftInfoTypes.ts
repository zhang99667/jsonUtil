import type { FileTab } from '../types';
import type { StatusBarBadgeState } from '../utils/statusBarState';
import type { StatusBarSourceValidationAction } from '../utils/statusBarSourceValidationActionTypes';

export interface StatusBarLeftInfoProps {
  activeContentLength: number;
  byteSizeText: string;
  totalLines: number;
  maxColumns: number;
  isStatsLimited: boolean;
  cursorLine?: number;
  cursorColumn?: number;
  activeFile: FileTab | null;
  saveStatus: StatusBarBadgeState;
  sourceValidationStatus: StatusBarBadgeState;
  sourceValidationAction: StatusBarSourceValidationAction;
}

export type StatusBarStatusBadgesProps = Pick<
  StatusBarLeftInfoProps,
  'activeFile' | 'saveStatus' | 'sourceValidationStatus' | 'sourceValidationAction'
>;
