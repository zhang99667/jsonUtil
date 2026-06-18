import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import { extractHarPayloads, importTextFileContent } from './harImport';

describe('harImport', () => {
  const harText = JSON.stringify({
    log: {
      entries: [
        {
          startedDateTime: '2026-06-18T00:00:00.000Z',
          request: {
            method: 'POST',
            url: 'https://api.example.com/order',
            postData: {
              mimeType: 'application/json',
              text: '{"id":1}',
            },
          },
          response: {
            status: 200,
            content: {
              mimeType: 'application/json',
              text: '{"ok":true,"cmd":"baiduboxapp://v1/open"}',
            },
          },
        },
        {
          request: {
            method: 'GET',
            url: 'https://static.example.com/image.png',
          },
          response: {
            status: 200,
            content: {
              mimeType: 'image/png',
            },
          },
        },
      ],
    },
  });

  it('从 HAR 中提取请求和响应 body', () => {
    const result = extractHarPayloads(harText);

    expect(result).toMatchObject({
      source: 'HAR_PAYLOAD_EXPORT',
      entryCount: 2,
      extractedEntryCount: 1,
      skippedEntryCount: 1,
    });
    expect(result?.entries[0]).toMatchObject({
      index: 0,
      request: {
        method: 'POST',
        url: 'https://api.example.com/order',
        body: {
          kind: 'json',
          value: { id: 1 },
        },
      },
      response: {
        status: 200,
        mimeType: 'application/json',
        body: {
          kind: 'json',
          value: {
            ok: true,
            cmd: 'baiduboxapp://v1/open',
          },
        },
      },
    });
  });

  it('支持提取 HAR postData params 表单参数', () => {
    const result = extractHarPayloads(JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: 'POST',
              url: 'https://api.example.com/form',
              postData: {
                mimeType: 'application/x-www-form-urlencoded',
                params: [
                  { name: 'scene', value: 'feed' },
                  { name: 'token', value: 'masked' },
                ],
              },
            },
            response: {
              status: 204,
              content: {},
            },
          },
        ],
      },
    }));

    expect(result?.entries[0].request.body).toEqual({
      kind: 'form',
      params: {
        scene: 'feed',
        token: 'masked',
      },
    });
  });

  it('支持解码 HAR response 中的 base64 JSON body', () => {
    const result = extractHarPayloads(JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: 'GET',
              url: 'https://api.example.com/base64',
            },
            response: {
              status: 200,
              content: {
                mimeType: 'application/json',
                encoding: 'base64',
                text: Buffer.from('{"encoded":true}', 'utf8').toString('base64'),
              },
            },
          },
        ],
      },
    }));

    expect(result?.entries[0].response.body).toEqual({
      kind: 'json',
      value: { encoded: true },
      encoding: 'base64',
    });
  });

  it('打开 HAR 文件时转换为派生 JSON 且不保留原文件句柄', () => {
    const imported = importTextFileContent('network.har', harText);

    expect(imported.name).toBe('network.har.payloads.json');
    expect(imported.mode).toBe(TransformMode.DEEP_FORMAT);
    expect(imported.preserveHandle).toBe(false);
    expect(imported.toastMessage).toContain('已从 HAR 提取 1/2 条');
    expect(JSON.parse(imported.content)).toMatchObject({
      source: 'HAR_PAYLOAD_EXPORT',
      extractedEntryCount: 1,
    });
  });

  it('非 HAR 文件保持原文和文件句柄', () => {
    expect(importTextFileContent('sample.json', '{"ok":true}')).toEqual({
      content: '{"ok":true}',
      preserveHandle: true,
    });
  });

  it('无法识别的 HAR 按普通文本打开并给出提示', () => {
    const imported = importTextFileContent('broken.har', '{"not":"har"}');

    expect(imported).toMatchObject({
      content: '{"not":"har"}',
      preserveHandle: true,
      toastType: 'info',
    });
    expect(imported.toastMessage).toContain('未识别到标准 HAR 结构');
  });
});
