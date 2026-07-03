import { describe, expect, it, vi } from 'vitest';
import {
  clickRenderedElement,
  renderSchemeFooterActionList,
  schemeViewerFooterActionTitles,
} from './SchemeViewerFooterActionTestFixture';
import { collectRenderedText, findRenderedByTour } from './schemeViewerRenderedElementTestHelpers';

describe('SchemeViewerFooterActionList', () => {
  it('渲染常用动作并透传回调、title 和 aria', () => {
    const onToggleQRCode = vi.fn();
    const onCopyOriginal = vi.fn();
    const tree = renderSchemeFooterActionList({ onToggleQRCode, onCopyOriginal });

    expect(collectRenderedText(tree)).toContain('二维码');
    expect(collectRenderedText(tree)).toContain('复制原始值');
    expect(collectRenderedText(tree)).toContain('复制解码结果');

    const qrCodeButton = findRenderedByTour(tree, 'scheme-qrcode-button')[0];
    expect(qrCodeButton.props.title).toBe(schemeViewerFooterActionTitles.qrCode);
    expect(qrCodeButton.props['aria-label']).toBe(`二维码，${schemeViewerFooterActionTitles.qrCode}`);
    expect(qrCodeButton.props['aria-pressed']).toBe(false);
    clickRenderedElement(qrCodeButton);
    clickRenderedElement(findRenderedByTour(tree, 'scheme-copy-original')[0]);

    expect(onToggleQRCode).toHaveBeenCalledTimes(1);
    expect(onCopyOriginal).toHaveBeenCalledTimes(1);
  });

  it('按能力展示可选动作', () => {
    const tree = renderSchemeFooterActionList({
      canCancelDecode: true,
      hasCommandSummary: true,
      canCopyCmdStructure: true,
      isJsonResult: true,
      canCopyPathValues: true,
      isStandalone: true,
      hasDecodeLayers: true,
      canCopySerializedContent: true,
      canShowApplyEdit: true,
      canApplyEdit: true,
    });

    expect(findRenderedByTour(tree, 'scheme-cancel-decode')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-copy-cmd-structure')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-copy-path-values')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-copy-serialized')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-apply-edit')).toHaveLength(1);
  });

  it('禁用不可用动作并保留二维码选中语义', () => {
    const tree = renderSchemeFooterActionList({
      showQRCode: true,
      canShowQRCode: false,
      canCopyDecoded: false,
      canShowApplyEdit: true,
      canApplyEdit: false,
    });

    expect(findRenderedByTour(tree, 'scheme-qrcode-button')[0].props.disabled).toBe(true);
    expect(findRenderedByTour(tree, 'scheme-qrcode-button')[0].props['aria-pressed']).toBe(true);
    expect(findRenderedByTour(tree, 'scheme-copy-decoded')[0].props.disabled).toBe(true);
    expect(findRenderedByTour(tree, 'scheme-apply-edit')[0].props.disabled).toBe(true);
  });
});
