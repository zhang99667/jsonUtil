import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  getTextFileOpenError,
  MAX_TEXT_FILE_SIZE_BYTES,
  TEXT_FILE_ACCEPT_EXTENSIONS,
} from './fileGuards';

describe('formatFileSize', () => {
  it('格式化字节大小', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('格式化 KB、MB 和 TB', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB');
    expect(formatFileSize(1024 ** 4)).toBe('1 TB');
  });
});

describe('getTextFileOpenError', () => {
  it('小于或等于上限时允许打开', () => {
    expect(getTextFileOpenError({
      name: 'ok.json',
      size: MAX_TEXT_FILE_SIZE_BYTES,
      type: 'application/json',
    })).toBeNull();
  });

  it('允许常见开发文本文件', () => {
    expect(getTextFileOpenError({
      name: 'app.log',
      size: 1024,
      type: '',
    })).toBeNull();
    expect(getTextFileOpenError({
      name: 'query.sql',
      size: 1024,
      type: 'text/plain',
    })).toBeNull();
  });

  it('允许常见 JSON 家族调试文件', () => {
    for (const name of [
      'network.har',
      'events.ndjson',
      'config.jsonc',
      'package.map',
      'city.geojson',
      'manifest.webmanifest',
    ]) {
      expect(getTextFileOpenError({
        name,
        size: 1024,
        type: 'application/octet-stream',
      })).toBeNull();
    }
  });

  it('允许 application/*+json 这类结构化 JSON MIME', () => {
    expect(getTextFileOpenError({
      name: 'response.payload',
      size: 1024,
      type: 'application/vnd.api+json',
    })).toBeNull();
  });

  it('超过上限时返回明确提示', () => {
    const error = getTextFileOpenError({
      name: 'huge.json',
      size: MAX_TEXT_FILE_SIZE_BYTES + 1,
      type: 'application/json',
    });

    expect(error).toContain('huge.json');
    expect(error).toContain('超过 50 MB 上限');
  });

  it('拒绝明显的二进制文件类型', () => {
    expect(getTextFileOpenError({
      name: 'avatar.png',
      size: 1024,
      type: 'image/png',
    })).toContain('不是文本/JSON 文件');

    expect(getTextFileOpenError({
      name: 'archive.zip',
      size: 1024,
      type: 'application/zip',
    })).toContain('不是文本/JSON 文件');
  });

  it('当浏览器给出通用 MIME 时仍允许白名单文本扩展名', () => {
    expect(getTextFileOpenError({
      name: 'payload.json',
      size: 1024,
      type: 'application/octet-stream',
    })).toBeNull();
  });
});

describe('TEXT_FILE_ACCEPT_EXTENSIONS', () => {
  it('文件选择器包含常见开发文本类型', () => {
    expect(TEXT_FILE_ACCEPT_EXTENSIONS).toEqual(expect.arrayContaining([
      '.json',
      '.jsonl',
      '.ndjson',
      '.har',
      '.geojson',
      '.webmanifest',
      '.map',
      '.log',
      '.sql',
      '.yaml',
      '.xml',
      '.csv',
    ]));
  });
});
