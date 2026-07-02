import { describe, expect, it, vi } from 'vitest';
import {
  buildAppEditorWorkspacePreviewPaneProps,
  buildAppEditorWorkspaceSourcePaneProps,
} from './appEditorWorkspacePaneProps';
import { buildAppEditorWorkspaceProps } from './AppEditorWorkspaceTestFixture';

describe('appEditorWorkspacePaneProps', () => {
  it('只把 SOURCE 字段传入 SOURCE pane', () => {
    const props = buildAppEditorWorkspaceSourcePaneProps(buildAppEditorWorkspaceProps(), vi.fn());

    expect(props.input).toBe('{"a":1}');
    expect(props.leftPaneWidthPercent).toBe(50);
    expect('output' in props).toBe(false);
    expect('previewValidation' in props).toBe(false);
  });

  it('只把 PREVIEW 字段传入 PREVIEW pane', () => {
    const props = buildAppEditorWorkspacePreviewPaneProps(buildAppEditorWorkspaceProps(), vi.fn());

    expect(props.output).toBe('{\n  "a": 1\n}');
    expect(props.previewValidation).toEqual({ isValid: true });
    expect('input' in props).toBe(false);
    expect('sourceValidation' in props).toBe(false);
  });
});
