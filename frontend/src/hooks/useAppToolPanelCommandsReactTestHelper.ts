import { vi } from 'vitest';
import {
  hasToolPanelCommandStateOverride,
  readToolPanelCommandInitialState,
  TOOL_PANEL_COMMAND_STATE_KEYS,
  type ToolPanelCommandStateOverrides,
  type ToolPanelCommandStateSetters,
} from './useAppToolPanelCommandsStateTestHelper';

export interface ToolPanelCommandReactMocks {
  useCallback: ReturnType<typeof vi.fn>;
  useEffect: ReturnType<typeof vi.fn>;
  useRef: ReturnType<typeof vi.fn>;
  useState: ReturnType<typeof vi.fn>;
}

export let cleanupEffect: (() => void) | undefined;
export let stateSetters: ToolPanelCommandStateSetters = {};

export const installToolPanelCommandReactMocks = (
  reactMocks: ToolPanelCommandReactMocks,
  stateOverrides: ToolPanelCommandStateOverrides
) => {
  let stateIndex = 0;
  let refIndex = 0;
  const refs = [
    { current: 0 },
    { current: 0 },
    { current: 0 },
    { current: 0 },
  ];

  stateSetters = {};
  cleanupEffect = undefined;

  reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  reactMocks.useEffect.mockImplementation((effect: () => void | (() => void)) => {
    const result = effect();
    cleanupEffect = typeof result === 'function' ? result : undefined;
  });
  reactMocks.useRef.mockImplementation((initialValue: unknown) => refs[refIndex++] ?? { current: initialValue });
  reactMocks.useState.mockImplementation((initialState: unknown) => {
    const key = TOOL_PANEL_COMMAND_STATE_KEYS[stateIndex++];
    const setter = vi.fn();
    stateSetters[key] = setter;
    const value = hasToolPanelCommandStateOverride(stateOverrides, key)
      ? stateOverrides[key]
      : readToolPanelCommandInitialState(initialState);
    return [value, setter];
  });
};
