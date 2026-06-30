import { describe, expect, it, vi } from 'vitest';
import { buildAppSourceReplacementCommands } from './appSourceReplacementCommandBundle';

describe('appSourceReplacementCommandBundle', () => {
  it('按 App 消费的公开字段合并 SOURCE 替换命令', () => {
    const handleRequestClearSource = vi.fn();
    const handleConfirmClearSource = vi.fn();
    const handleCancelClearSource = vi.fn();
    const handleInspectSourceFromScheme = vi.fn();
    const handleConfirmSchemeInspectSource = vi.fn();
    const handleCancelSchemeInspectSource = vi.fn();
    const handlePasteSource = vi.fn();
    const handleConfirmPasteSource = vi.fn();
    const handleCancelPasteSource = vi.fn();
    const handleRequestApplyPreviewToSource = vi.fn();
    const handleConfirmApplyPreviewToSource = vi.fn();
    const handleCancelApplyPreviewToSource = vi.fn();
    const handleRequestApplySchemaExampleToSource = vi.fn();
    const handleConfirmApplySchemaExampleToSource = vi.fn();
    const handleCancelApplySchemaExampleToSource = vi.fn();

    const commands = buildAppSourceReplacementCommands({
      clearSourceCommands: {
        isClearSourceConfirmOpen: true,
        handleRequestClearSource,
        handleConfirmClearSource,
        handleCancelClearSource,
      },
      schemeInspectCommands: {
        pendingSchemeInspectSourceText: 'scheme',
        handleInspectSourceFromScheme,
        handleConfirmSchemeInspectSource,
        handleCancelSchemeInspectSource,
      },
      pasteCommands: {
        pendingPasteSourceText: 'clipboard',
        handlePasteSource,
        handleConfirmPasteSource,
        handleCancelPasteSource,
      },
      applyCommands: {
        pendingApplyPreviewText: 'preview',
        pendingSchemaExampleText: 'schema',
        handleRequestApplyPreviewToSource,
        handleConfirmApplyPreviewToSource,
        handleCancelApplyPreviewToSource,
        handleRequestApplySchemaExampleToSource,
        handleConfirmApplySchemaExampleToSource,
        handleCancelApplySchemaExampleToSource,
      },
    });

    expect(commands).toMatchObject({
      isClearSourceConfirmOpen: true,
      pendingSchemeInspectSourceText: 'scheme',
      pendingPasteSourceText: 'clipboard',
      pendingApplyPreviewText: 'preview',
      pendingSchemaExampleText: 'schema',
    });
    expect(commands.handleRequestClearSource).toBe(handleRequestClearSource);
    expect(commands.handleConfirmSchemeInspectSource).toBe(handleConfirmSchemeInspectSource);
    expect(commands.handlePasteSource).toBe(handlePasteSource);
    expect(commands.handleRequestApplySchemaExampleToSource).toBe(handleRequestApplySchemaExampleToSource);
    expect(Object.keys(commands)).toEqual([
      'isClearSourceConfirmOpen',
      'handleRequestClearSource',
      'handleConfirmClearSource',
      'handleCancelClearSource',
      'pendingSchemeInspectSourceText',
      'handleInspectSourceFromScheme',
      'handleConfirmSchemeInspectSource',
      'handleCancelSchemeInspectSource',
      'pendingPasteSourceText',
      'handlePasteSource',
      'handleConfirmPasteSource',
      'handleCancelPasteSource',
      'pendingApplyPreviewText',
      'pendingSchemaExampleText',
      'handleRequestApplyPreviewToSource',
      'handleConfirmApplyPreviewToSource',
      'handleCancelApplyPreviewToSource',
      'handleRequestApplySchemaExampleToSource',
      'handleConfirmApplySchemaExampleToSource',
      'handleCancelApplySchemaExampleToSource',
    ]);
  });
});
