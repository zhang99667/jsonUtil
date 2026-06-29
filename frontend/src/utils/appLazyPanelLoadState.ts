export const APP_LAZY_PANEL_KEYS = [
  'settings',
  'changelog',
  'jsonPath',
  'jsonTree',
  'jsonCompare',
  'jsonSchema',
  'scheme',
  'template',
  'transformReport',
] as const;

export type AppLazyPanelKey = typeof APP_LAZY_PANEL_KEYS[number];
export type AppLazyPanelLoadState = Record<AppLazyPanelKey, boolean>;

export const createAppLazyPanelLoadState = (): AppLazyPanelLoadState => ({
  settings: false,
  changelog: false,
  jsonPath: false,
  jsonTree: false,
  jsonCompare: false,
  jsonSchema: false,
  scheme: false,
  template: false,
  transformReport: false,
});

export const updateAppLazyPanelLoadState = (
  current: AppLazyPanelLoadState,
  openState: AppLazyPanelLoadState
): AppLazyPanelLoadState => {
  let nextState: AppLazyPanelLoadState | null = null;

  for (const key of APP_LAZY_PANEL_KEYS) {
    if (!openState[key] || current[key]) continue;

    nextState = nextState ? nextState : { ...current };
    nextState[key] = true;
  }

  return nextState ?? current;
};
