import { vi } from 'vitest';
import { TransformMode } from '../types';
import { useAppToolPanelCommands } from './useAppToolPanelCommands';
import {
  type ToolPanelCommandStateOverrides,
} from './useAppToolPanelCommandsStateTestHelper';
import {
  installToolPanelCommandReactMocks,
  cleanupEffect,
  stateSetters,
} from './useAppToolPanelCommandsReactTestHelper';
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

export { cleanupEffect, stateSetters } from './useAppToolPanelCommandsReactTestHelper';

export const useToolPanelCommandsFixture = (
  options: Partial<Parameters<typeof useAppToolPanelCommands>[0]> = {},
  stateOverrides: ToolPanelCommandStateOverrides = {},
) => {
  const eventListeners = installToolPanelCommandWindowStubs();
  installToolPanelCommandReactMocks(reactMocks, stateOverrides);

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
