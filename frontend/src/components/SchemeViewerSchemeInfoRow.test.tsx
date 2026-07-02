import { describe, expect, it } from 'vitest';
import { SchemeViewerSchemeInfoRow } from './SchemeViewerSchemeInfoRow';
import {
  collectText,
  findByTour,
  findByTourOrNull,
} from './schemeViewerElementTestHelpers';

describe('SchemeViewerSchemeInfoRow', () => {
  it('没有 Scheme 信息时不渲染', () => {
    expect(SchemeViewerSchemeInfoRow({ schemeInfo: undefined })).toBeNull();
  });

  it('渲染协议、host 和路径', () => {
    const tree = SchemeViewerSchemeInfoRow({
      schemeInfo: {
        protocol: 'baiduboxapp:',
        host: 'v7',
        path: '/vendor/ad/prerender',
      },
    });

    expect(findByTour(tree, 'scheme-info-row')).toHaveLength(1);
    expect(collectText(tree)).toContain('Scheme:');
    expect(collectText(tree)).toContain('baiduboxapp:');
    expect(collectText(tree)).toContain('v7');
    expect(collectText(tree)).toContain('/vendor/ad/prerender');
  });

  it('保留路径完整 title 供截断时查看', () => {
    const tree = SchemeViewerSchemeInfoRow({
      schemeInfo: {
        protocol: 'https:',
        host: 'example.com',
        path: '/very/long/path',
      },
    });
    const row = findByTourOrNull(tree, 'scheme-info-row');
    const pathChip = row?.props.children?.[3];

    expect(pathChip?.props.title).toBe('/very/long/path');
  });
});
