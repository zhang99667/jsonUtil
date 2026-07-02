export interface PanelToggleCommandConfig {
  openEventName: string;
  closeEventName: string;
  requireDeepFormat?: boolean;
}

export const APP_TOOL_PANEL_TOGGLE_COMMANDS = {
  jsonPath: {
    openEventName: 'JSONPATH_OPEN',
    closeEventName: 'JSONPATH_CLOSE',
    requireDeepFormat: true,
  },
  jsonTree: {
    openEventName: 'STRUCTURE_NAV_OPEN',
    closeEventName: 'STRUCTURE_NAV_CLOSE',
    requireDeepFormat: true,
  },
  jsonCompare: {
    openEventName: 'JSON_COMPARE_OPEN',
    closeEventName: 'JSON_COMPARE_CLOSE',
  },
  jsonSchema: {
    openEventName: 'SCHEMA_PANEL_OPEN',
    closeEventName: 'SCHEMA_PANEL_CLOSE',
  },
  schemeDecode: {
    openEventName: 'SCHEME_PANEL_OPEN',
    closeEventName: 'SCHEME_PANEL_CLOSE',
  },
  templateFill: {
    openEventName: 'TEMPLATE_PANEL_OPEN',
    closeEventName: 'TEMPLATE_PANEL_CLOSE',
  },
} satisfies Record<string, PanelToggleCommandConfig>;
