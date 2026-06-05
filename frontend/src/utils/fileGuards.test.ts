import { describe, expect, it } from 'vitest';
import { formatFileSize, getTextFileOpenError, MAX_TEXT_FILE_SIZE_BYTES } from './fileGuards';

describe('formatFileSize', () => {
  it('格式化字节大小', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('格式化 KB 和 MB', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB');
  });
});

describe('getTextFileOpenError', () => {
  it('小于或等于上限时允许打开', () => {
    expect(getTextFileOpenError({ name: 'ok.json', size: MAX_TEXT_FILE_SIZE_BYTES })).toBeNull();
  });

  it('超过上限时返回明确提示', () => {
    const error = getTextFileOpenError({
      name: 'huge.json',
      size: MAX_TEXT_FILE_SIZE_BYTES + 1,
    });

    expect(error).toContain('huge.json');
    expect(error).toContain('超过 50 MB 上限');
  });
});
