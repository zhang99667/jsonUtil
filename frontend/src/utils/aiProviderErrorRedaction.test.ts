import { describe, expect, it } from 'vitest';
import {
  AI_ERROR_DETAIL_MAX_LENGTH,
  AI_ERROR_DETAIL_REDACTION_PLACEHOLDER,
  formatAiErrorDetailSummary,
  redactAiErrorDetail,
} from './aiProviderErrorRedaction';

describe('ai provider error redaction', () => {
  it('隐藏 provider 错误详情中的常见密钥形态', () => {
    expect(redactAiErrorDetail('token=raw-token&ok=1'))
      .toBe(`token=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}&ok=1`);
    expect(redactAiErrorDetail('Authorization: Bearer gateway-token-123456'))
      .toBe(`Authorization: Bearer ${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(redactAiErrorDetail('failed with sk-live-network123'))
      .toBe(`failed with ${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
  });

  it('隐藏 provider 回显的敏感输入策略字段', () => {
    const redacted = redactAiErrorDetail([
      'sign=raw-sign',
      'cookie=session=raw-cookie;',
      'auth=Bearer raw-auth-token',
      'authorization=Basic raw-basic-token',
      '"device_id":"raw-device-id"',
      'android_id=raw-android-id',
      'imei=raw-imei',
      'idfa=raw-idfa',
      'oaid_sum=raw-oaid',
      'cuid=raw-cuid',
      'akey=raw-akey',
    ].join(' '));

    [
      'raw-sign',
      'raw-cookie',
      'raw-auth-token',
      'raw-basic-token',
      'raw-device-id',
      'raw-android-id',
      'raw-imei',
      'raw-idfa',
      'raw-oaid',
      'raw-cuid',
      'raw-akey',
    ].forEach(secret => expect(redacted).not.toContain(secret));
    expect(redacted).toContain(`sign=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(redacted).toContain(`cookie=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(redacted).toContain(`auth=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(redacted).toContain(`authorization=Basic ${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(redacted).toContain(`device_id":"${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
  });

  it('隐藏带引号和空格的敏感字段值', () => {
    const redacted = redactAiErrorDetail([
      '"password":"my secret value"',
      'cookie="a=b; c=d"',
      'auth="Bearer raw token"',
    ].join(' '));

    expect(redacted).toContain(`"password":"${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}"`);
    expect(redacted).toContain(`cookie="${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}"`);
    expect(redacted).toContain(`auth="${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}"`);
    expect(redacted).not.toContain('my secret value');
    expect(redacted).not.toContain('a=b; c=d');
    expect(redacted).not.toContain('Bearer raw token');
  });

  it('错误摘要会先脱敏再截断长度', () => {
    const summary = formatAiErrorDetailSummary(
      `upstream api_key=sk-live-secret123 ${'x'.repeat(400)}`
    );

    expect(summary).toContain(`api_key=${AI_ERROR_DETAIL_REDACTION_PLACEHOLDER}`);
    expect(summary).not.toContain('sk-live-secret123');
    expect(summary.endsWith('...')).toBe(true);
    expect(summary.length).toBe(AI_ERROR_DETAIL_MAX_LENGTH + 3);
  });
});
