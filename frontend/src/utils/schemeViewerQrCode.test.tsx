import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { describe, expect, it } from 'vitest';
import {
  getSchemeViewerQrCodeCapacity,
  SCHEME_QR_CODE_LEVEL_M_MAX_ALPHANUMERIC_CHARACTERS,
  SCHEME_QR_CODE_LEVEL_M_MAX_BYTES,
  SCHEME_QR_CODE_LEVEL_M_MAX_NUMERIC_CHARACTERS,
} from './schemeViewerQrCode';

describe('schemeViewerQrCode', () => {
  it('空内容不可生成二维码', () => {
    expect(getSchemeViewerQrCodeCapacity('')).toEqual({
      canRender: false,
      blockReason: 'empty',
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_BYTES,
      mode: 'byte',
      utf8ByteLength: 0,
    });
  });

  it('按 M 级字节模式的精确上限处理单字节内容', () => {
    expect(getSchemeViewerQrCodeCapacity('a'.repeat(2_331))).toEqual({
      canRender: true,
      blockReason: null,
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_BYTES,
      mode: 'byte',
      utf8ByteLength: 2_331,
    });
    expect(getSchemeViewerQrCodeCapacity('a'.repeat(2_332))).toEqual({
      canRender: false,
      blockReason: 'too-long',
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_BYTES,
      mode: 'byte',
      utf8ByteLength: 2_332,
    });
  });

  it('使用 UTF-8 字节数限制中文内容', () => {
    expect(getSchemeViewerQrCodeCapacity('中'.repeat(777))).toEqual({
      canRender: true,
      blockReason: null,
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_BYTES,
      mode: 'byte',
      utf8ByteLength: 2_331,
    });
    expect(getSchemeViewerQrCodeCapacity('中'.repeat(778))).toEqual({
      canRender: false,
      blockReason: 'too-long',
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_BYTES,
      mode: 'byte',
      utf8ByteLength: 2_334,
    });
  });

  it('保留数字和大写字母数字模式的额外容量', () => {
    expect(getSchemeViewerQrCodeCapacity('1'.repeat(5_596))).toMatchObject({
      canRender: true,
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_NUMERIC_CHARACTERS,
      mode: 'numeric',
    });
    expect(getSchemeViewerQrCodeCapacity('1'.repeat(5_597))).toMatchObject({
      blockReason: 'too-long',
      canRender: false,
      mode: 'numeric',
    });
    expect(getSchemeViewerQrCodeCapacity('A'.repeat(3_391))).toMatchObject({
      canRender: true,
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_ALPHANUMERIC_CHARACTERS,
      mode: 'alphanumeric',
    });
    expect(getSchemeViewerQrCodeCapacity('A'.repeat(3_392))).toMatchObject({
      blockReason: 'too-long',
      canRender: false,
      mode: 'alphanumeric',
    });
  });

  it('不完整代理字符不会进入二维码渲染', () => {
    const malformedContent = '\uD800';

    expect(getSchemeViewerQrCodeCapacity(malformedContent)).toEqual({
      canRender: false,
      blockReason: 'invalid-unicode',
      maxInputLength: SCHEME_QR_CODE_LEVEL_M_MAX_BYTES,
      mode: 'byte',
      utf8ByteLength: 3,
    });
    expect(() => renderToStaticMarkup(
      <QRCodeSVG value={malformedContent} level="M" />,
    )).toThrow();
  });

  it.each([
    ['数字', '1', SCHEME_QR_CODE_LEVEL_M_MAX_NUMERIC_CHARACTERS],
    ['字母数字', 'A', SCHEME_QR_CODE_LEVEL_M_MAX_ALPHANUMERIC_CHARACTERS],
    ['字节', 'a', SCHEME_QR_CODE_LEVEL_M_MAX_BYTES],
  ] as const)('%s 容量常量与当前二维码依赖的 M 级边界一致', (_mode, character, maxLength) => {
    const renderQrCode = (content: string) => renderToStaticMarkup(
      <QRCodeSVG value={content} level="M" />,
    );

    expect(() => renderQrCode(character.repeat(maxLength))).not.toThrow();
    expect(() => renderQrCode(character.repeat(maxLength + 1))).toThrow();
  });
});
