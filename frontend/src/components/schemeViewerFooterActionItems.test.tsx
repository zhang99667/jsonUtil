import { describe, expect, it } from 'vitest';
import { createSchemeFooterActionListProps } from './SchemeViewerFooterActionTestFixture';
import {
  buildSchemeViewerFooterActionItems,
} from './schemeViewerFooterActionItems';

describe('schemeViewerFooterActionItems', () => {
  it('保留可选按钮的显隐顺序和 tone', () => {
    const items = buildSchemeViewerFooterActionItems(createSchemeFooterActionListProps({
      canCancelDecode: true,
      hasCommandSummary: true,
      isJsonResult: true,
      isStandalone: true,
      hasDecodeLayers: true,
      canShowApplyEdit: true,
    }));

    expect(items.filter(item => item.visible).map(item => item.dataTour)).toEqual([
      'scheme-cancel-decode',
      'scheme-qrcode-button',
      'scheme-copy-original',
      'scheme-copy-decoded',
      'scheme-copy-cmd-structure',
      'scheme-copy-path-values',
      'scheme-copy-serialized',
      'scheme-apply-edit',
    ]);
    expect(items.find(item => item.dataTour === 'scheme-cancel-decode')?.tone).toBe('warning');
    expect(items.find(item => item.dataTour === 'scheme-apply-edit')?.tone).toBe('primary');
  });
});
