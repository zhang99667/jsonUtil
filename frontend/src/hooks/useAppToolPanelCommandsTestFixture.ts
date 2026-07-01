import { vi } from 'vitest';
import { TransformMode } from '../types';
import { useAppToolPanelCommands } from './useAppToolPanelCommands';

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

const STATE_KEYS = [
  'isJsonPathPanelOpen',
  'isJsonTreePanelOpen',
  'isJsonComparePanelOpen',
  'isJsonSchemaPanelOpen',
  'jsonPathQueryRequest',
  'jsonTreeFocusRequest',
  'schemeInputRequest',
  'templateFillRequest',
  'isSettingsModalOpen',
  'settingsInitialTab',
  'isChangelogModalOpen',
  'changelogSourceMarkdown',
  'changelogHighlightedVersion',
  'isSchemeDecodeOpen',
  'isTemplatePanelOpen',
  'templateApplyQualityDelta',
  'isTransformReportOpen',
] as const;

type StateKey = typeof STATE_KEYS[number];
type StateOverrides = Partial<Record<StateKey, unknown>>;
type StateSetters = Partial<Record<StateKey, ReturnType<typeof vi.fn>>>;

interface FakeCustomEventInit<T> {
  detail?: T;
}

class FakeCustomEvent<T = unknown> extends Event {
  detail: T | undefined;

  constructor(type: string, init: FakeCustomEventInit<T> = {}) {
    super(type);
    this.detail = init.detail;
  }
}

export let cleanupEffect: (() => void) | undefined;
export let stateSetters: StateSetters = {};

const hasOwn = (value: object, key: PropertyKey): boolean => (
  Object.prototype.hasOwnProperty.call(value, key)
);

const readInitialState = (initialState: unknown): unknown => (
  typeof initialState === 'function'
    ? (initialState as () => unknown)()
    : initialState
);

const installReactMocks = (stateOverrides: StateOverrides) => {
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
    const key = STATE_KEYS[stateIndex++];
    const setter = vi.fn();
    stateSetters[key] = setter;
    const value = hasOwn(stateOverrides, key)
      ? stateOverrides[key]
      : readInitialState(initialState);
    return [value, setter];
  });
};

export const useToolPanelCommandsFixture = (
  options: Partial<Parameters<typeof useAppToolPanelCommands>[0]> = {},
  stateOverrides: StateOverrides = {},
) => {
  const eventListeners = new Map<string, EventListener>();
  vi.stubGlobal('CustomEvent', FakeCustomEvent);
  vi.stubGlobal('window', {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      eventListeners.set(type, listener);
    }),
    removeEventListener: vi.fn(),
  });
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
