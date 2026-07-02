import { vi } from 'vitest';

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

export const installToolPanelCommandWindowStubs = (): Map<string, EventListener> => {
  const eventListeners = new Map<string, EventListener>();

  vi.stubGlobal('CustomEvent', FakeCustomEvent);
  vi.stubGlobal('window', {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      eventListeners.set(type, listener);
    }),
    removeEventListener: vi.fn(),
  });

  return eventListeners;
};
