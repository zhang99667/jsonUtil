export type ActionPanelPanelItemId =
  | 'jsonPath'
  | 'jsonCompare'
  | 'jsonTree'
  | 'jsonSchema'
  | 'scheme'
  | 'template';

export type ActionPanelPanelIconId =
  | 'search'
  | 'compare'
  | 'structure'
  | 'schema'
  | 'link'
  | 'template';

export interface ActionPanelPanelItem {
  id: ActionPanelPanelItemId;
  label: string;
  iconId: ActionPanelPanelIconId;
  iconClass: string;
  hoverIconClass: string;
  dataTour: string;
}
