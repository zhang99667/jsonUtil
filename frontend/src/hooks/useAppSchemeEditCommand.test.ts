import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAppSchemeEditCommand } from '../utils/appSchemeEditCommandRunner';
import { useAppSchemeEditCommand } from './useAppSchemeEditCommand';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/appSchemeEditCommandRunner', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appSchemeEditCommandRunner')>(),
  runAppSchemeEditCommand: vi.fn(),
}));

const useSchemeEditFixture = (previewText: string) => {
  const onPreviewChange = vi.fn();
  const { handleSchemeEdit } = useAppSchemeEditCommand({
    previewText,
    onPreviewChange,
  });

  return { handleSchemeEdit, onPreviewChange };
};

describe('useAppSchemeEditCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('把 Scheme 编辑参数和当前 PREVIEW 交给 runner', () => {
    const { handleSchemeEdit, onPreviewChange } = useSchemeEditFixture('{"data":{"url":"old"}}');

    handleSchemeEdit('$.data.url', 'new', '/data/url');

    expect(runAppSchemeEditCommand).toHaveBeenCalledWith({
      previewText: '{"data":{"url":"old"}}',
      jsonPath: '$.data.url',
      newValue: 'new',
      pointer: '/data/url',
      onPreviewChange,
    });
  });
});
