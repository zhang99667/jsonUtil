export const PANEL_LAYOUT_RESET_EVENT = 'json-helper-panel-layout-reset';

export const FLOATING_PANEL_STORAGE_KEYS = [
  'jsonpath-panel',
  'scheme-panel',
  'template-fill-panel',
] as const;

export const resetFloatingPanelLayoutStorage = (
  storage: Storage = localStorage,
  keys: readonly string[] = FLOATING_PANEL_STORAGE_KEYS
) => {
  keys.forEach(key => {
    storage.removeItem(`${key}-position`);
    storage.removeItem(`${key}-size`);
  });
};

export const notifyFloatingPanelLayoutReset = (target: EventTarget = window) => {
  target.dispatchEvent(new Event(PANEL_LAYOUT_RESET_EVENT));
};
