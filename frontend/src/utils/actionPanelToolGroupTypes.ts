import type { TransformMode } from '../types';

export const ACTION_PANEL_TOOL_ICON_IDS = [
  'document',
  'format',
  'flask',
  'bolt',
  'escape',
  'quote',
  'unicode',
  'chinese',
  'percent',
  'url',
  'base64',
  'base64-short',
  'sort',
  'typescript',
] as const;

export type ActionPanelToolIconId = typeof ACTION_PANEL_TOOL_ICON_IDS[number];

export interface ActionPanelToolItem {
  mode: TransformMode;
  label: string;
  iconId: ActionPanelToolIconId;
  colorClass: string;
  dataTour?: string;
}

export interface ActionPanelToolGroup {
  id: string;
  title: string;
  items: ActionPanelToolItem[];
}
