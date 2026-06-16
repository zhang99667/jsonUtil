import { describe, expect, it } from 'vitest';
import {
  applyFixtureReplacements,
  buildCorpusFixtureCandidate,
  redactJsonValue,
  redactStringContent,
} from './scheme-corpus-promote.mjs';

describe('scheme-corpus-promote', () => {
  it('脱敏常见设备标识、签名和长数字', () => {
    const input = {
      user_id: 'real-user-001',
      searchid: 1399430455105144000,
      url: 'https://example.com/click?oaid=121e5f55-66cc-467d-b5f6-f014f6b4ba16&sign=abc123&safe=ok',
      nested: {
        callbackUrl: 'https://callback.example.com/track?clickId=1000000000000000000&callbackUrl=ok',
      },
    };

    const redacted = redactJsonValue(input);

    expect(redacted).toEqual({
      user_id: '__REDACTED_USERID__',
      searchid: 0,
      url: 'https://example.com/click?oaid=__REDACTED_OAID__&sign=__REDACTED_SIGN__&safe=ok',
      nested: {
        callbackUrl: 'https://callback.example.com/track?clickId=1000000000000&callbackUrl=ok',
      },
    });
  });

  it('保留运行时占位符并脱敏 base64 JSON 片段', () => {
    const encoded = Buffer.from(JSON.stringify({
      user_id: 'real-user-001',
      cmatch: 1501,
      sign: '__SIGN__',
    })).toString('base64');

    const output = redactStringContent(`extInfo=${encoded}&sign=__SIGN__`);
    const [, redactedBase64] = output.match(/extInfo=([^&]+)/) || [];
    const decoded = JSON.parse(Buffer.from(decodeURIComponent(redactedBase64), 'base64').toString('utf8'));

    expect(output).toContain('sign=__SIGN__');
    expect(decoded).toEqual({
      user_id: '__REDACTED_USERID__',
      cmatch: 1501,
      sign: '__SIGN__',
    });
  });

  it('长数字脱敏不会破坏 percent-encoded JSON 边界', () => {
    const encodedJson = 'video_info=%7B%22vid%22%3A%221353102586669%22%7D';
    const output = redactStringContent(encodedJson);

    expect(output).toBe('video_info=%7B%22vid%22%3A%221000000000000%22%7D');
    expect(() => decodeURIComponent(output)).not.toThrow();
  });

  it('递归脱敏编码 JSON 和内层 Scheme 参数', () => {
    const extInfo = Buffer.from(JSON.stringify({
      user_id: 'real-user-001',
      cmatch: 1501,
    })).toString('base64');
    const inner = `baiduboxapp://v7/vendor/ad/deeplink?token=raw-token&extInfo=${extInfo}`;
    const outer = `nadcorevendor://vendor/ad/rewardImpl?params=${encodeURIComponent(JSON.stringify({
      token: 'raw-root-token',
      inner,
    }))}`;

    const output = redactStringContent(outer);
    const params = new URL(output).searchParams.get('params');
    const decodedParams = JSON.parse(params || '{}');
    const innerUrl = new URL(decodedParams.inner);
    const redactedExtInfo = JSON.parse(Buffer.from(innerUrl.searchParams.get('extInfo') || '', 'base64').toString('utf8'));

    expect(decodedParams.token).toBe('__REDACTED_TOKEN__');
    expect(innerUrl.searchParams.get('token')).toBe('__REDACTED_TOKEN__');
    expect(redactedExtInfo.user_id).toBe('__REDACTED_USERID__');
    expect(output).not.toContain('raw-token');
    expect(output).not.toContain('raw-root-token');
    expect(output).not.toContain('real-user-001');
  });

  it('递归脱敏双重编码 JSON 参数', () => {
    const taskParams = encodeURIComponent(encodeURIComponent(JSON.stringify({
      token: 'deep-token',
      ext_policy: JSON.stringify({
        invoke_token: 'deep-invoke-token',
      }),
    })));
    const scheme = `nadcorevendor://vendor/ad/reward?task_params=${taskParams}`;

    const output = redactStringContent(scheme);
    const decodedTaskParams = new URL(output).searchParams.get('task_params') || '';
    const parsed = JSON.parse(decodedTaskParams);
    const extPolicy = JSON.parse(parsed.ext_policy);

    expect(parsed.token).toBe('__REDACTED_TOKEN__');
    expect(extPolicy.invoke_token).toBe('__REDACTED_INVOKETOKEN__');
    expect(output).not.toContain('deep-token');
    expect(output).not.toContain('deep-invoke-token');
  });

  it('兜底脱敏多层编码 JSON 属性', () => {
    const encoded = encodeURIComponent(encodeURIComponent(JSON.stringify({
      token: 'raw-token-value',
      invoke_token: 'raw-invoke-token',
    })));

    const output = redactStringContent(`params=${encoded}`);
    const decodedOnce = decodeURIComponent(output);

    expect(output).not.toContain('raw-token-value');
    expect(output).not.toContain('raw-invoke-token');
    expect(decodedOnce).toContain('__REDACTED_TOKEN__');
    expect(decodedOnce).toContain('__REDACTED_INVOKETOKEN__');
  });

  it('脱敏下划线拼接的长数字标识', () => {
    expect(redactStringContent('2174_1399430455105144167')).toBe('2174_1000000000000');
  });

  it('生成可回填的 corpus 候选 fixture', () => {
    const response = {
      errno: 0,
      data: {
        video: [{
          material: [{
            info: [{
              ad_common: {
                scheme: `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
                  vid: '1353102586669',
                  callbackUrl: 'https://callback.example.com/track?sign=abc&callbackUrl=ok',
                }))}`,
              },
            }],
          }],
          extra: [{
            k: 'extraParam',
            v: `AFD8f${Buffer.from(JSON.stringify({ oaid: 'raw-oaid' })).toString('base64')}`,
          }],
        }],
      },
    };

    const fixture = buildCorpusFixtureCandidate(response, {
      name: 'unit-response-redacted',
      chunkSize: 80,
    });
    const rebuilt = applyFixtureReplacements(fixture.responseTemplate, fixture.replacements);
    const fixtureText = JSON.stringify(fixture);
    const rebuiltText = JSON.stringify(rebuilt);

    expect(fixture.name).toBe('unit-response-redacted');
    expect(Object.keys(fixture.replacements).length).toBeGreaterThan(0);
    expect(rebuilt.data.video[0].extra[0].v).toContain('AFD8f');
    expect(fixtureText).not.toContain('raw-oaid');
    expect(rebuiltText).not.toContain('raw-oaid');
    expect(rebuiltText).not.toContain('sign=abc');
  });
});
