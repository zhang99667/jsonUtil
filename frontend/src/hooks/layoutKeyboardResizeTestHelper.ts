import { vi } from 'vitest';

export const createLayoutKeyboardEvent = (key: string, shiftKey = false) => ({
  key,
  shiftKey,
  preventDefault: vi.fn(),
});
