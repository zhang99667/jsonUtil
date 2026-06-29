import { describe, expect, it } from 'vitest';
import { base64Encode } from './schemeBase64Codec';
import { decodeJwt } from './schemeJwt';

describe('schemeJwt', () => {
  it('解析 JWT header 和 payload', () => {
    const header = base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/g, '');
    const payload = base64Encode(JSON.stringify({ sub: '123' })).replace(/=+$/g, '');

    expect(decodeJwt(`${header}.${payload}.signature`)).toMatchObject({
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '123' },
      signature: 'signature',
    });
  });

  it('拒绝非对象 JWT header 或 payload', () => {
    const header = base64Encode(JSON.stringify(1)).replace(/=+$/g, '');
    const payload = base64Encode(JSON.stringify({ sub: '123' })).replace(/=+$/g, '');

    expect(decodeJwt(`${header}.${payload}.signature`)).toBeNull();
    expect(decodeJwt(`foo.${payload}.signature`)).toBeNull();
    expect(decodeJwt(`${payload}.${payload}`)).toBeNull();
  });
});
