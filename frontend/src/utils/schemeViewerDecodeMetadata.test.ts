import { describe, expect, it } from 'vitest';
import type { SchemeDecodeResult } from './schemeTypes';
import {
  buildSchemeViewerDecodeMetadata,
  createEmptySchemeDecodeResult,
} from './schemeViewerDecodeMetadata';

describe('schemeViewerDecodeMetadata', () => {
  it('创建空解码结果时保留原始值', () => {
    expect(createEmptySchemeDecodeResult('raw')).toEqual({
      original: 'raw',
      decoded: '',
      layers: [],
      isJson: false,
    });
  });

  it('复用弹窗 metadata 构建规则并支持关闭命令字段明细', () => {
    const result: SchemeDecodeResult = {
      original: 'source-value',
      decoded: JSON.stringify({
        video_info: {
          tail_frame: {
            panel_scheme: {
              ext_info: {
                user_id: 'u1',
              },
            },
          },
        },
      }),
      layers: [],
      isJson: true,
    };

    const withRows = buildSchemeViewerDecodeMetadata(result);
    const withoutRows = buildSchemeViewerDecodeMetadata(result, {
      includeCommandFieldRows: false,
    });

    expect(withRows.commandSummaryInfo?.commandFields).toEqual(['panel_scheme']);
    expect(withRows.commandSummaryInfo?.commandFieldRows).toHaveLength(1);
    expect(withoutRows.commandSummaryInfo?.commandFields).toEqual(['panel_scheme']);
    expect(withoutRows.commandSummaryInfo?.commandFieldRows).toEqual([]);
  });

  it('提取弹窗需要的 Base64 后缀摘要', () => {
    const metadata = buildSchemeViewerDecodeMetadata({
      original: 'source-value',
      decoded: JSON.stringify({
        _base64_prefix: 'AFD',
        _base64_suffix: 'b3M9MiZpcD0xMjcuMC4wLjE=',
        _base64_suffix_decode_prefix: '',
        _base64_suffix_decoded: {
          os: '2',
          ip: '127.0.0.1',
        },
      }),
      layers: [],
      isJson: true,
    });

    expect(metadata.base64MetaInfo?.suffixDecodedEntries).toEqual([
      { key: 'os', displayValue: '2' },
      { key: 'ip', displayValue: '127.0.0.1' },
    ]);
  });
});
