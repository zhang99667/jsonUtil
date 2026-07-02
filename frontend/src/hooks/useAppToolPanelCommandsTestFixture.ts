import { vi } from 'vitest';
import { TransformMode } from '../types';
import { useAppToolPanelCommands } from './useAppToolPanelCommands';
import {
  hasToolPanelCommandStateOverride,
  readToolPanelCommandInitialState,
  TOOL_PANEL_COMMAND_STATE_KEYS,
  type ToolPanelCommandStateOverrides,
  type ToolPanelCommandStateSetters,
} from './useAppToolPanelCommandsStateTestHelper';
import { installToolPanelCommandWindowStubs } from './useAppToolPanelCommandsWindowTestHelper';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));

export let cleanupEffect: (() => void) | undefined;
export let stateSetters: ToolPanelCommandStateSetters = {};

const installReactMocks = (stateOverrides: ToolPanelCommandStateOverrides) => {
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

export const useToolPanelCommandsFixture = (
  options: Partial<Parameters<typeof useAppToolPanelCommands>[0]> = {},
  stateOverrides: ToolPanelCommandStateOverrides = {},
) => {
  const eventListeners = installToolPanelCommandWindowStubs();
  installReactMocks(stateOverrides);

  const onSetMode = vi.fn();
  const onSetHighlightRange = vi.fn();
  const onTrackToolEvent = vi.fn();
  const commands = useAppToolPanelCommands({
    mode: TransformMode.NONE,
    sourceText: '',
    onSetMode,
    onSetHighlightRange,
    onTrackToolEvent,
    ...options,
  });

  return {
    commands,
    listeners: eventListeners,
    onSetHighlightRange,
    onSetMode,
    onTrackToolEvent,
    stateSetters,
  };
};
