import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import { AppStatusBarController } from './AppStatusBarController';
import type { AppStatusBarActiveEditor } from './AppStatusBarControllerTypes';
import { StatusBar } from './StatusBar';

const reactMocks = vi.hoisted(() => ({
  useMemo: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useMemo: reactMocks.useMemo,
}));

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const activeFile: FileTab = {
  id: 'file-1',
  name: 'demo.json',
  content: '{"ok":true}',
  isDirty: false,
};

const buildProps = () => ({
  sourceText: '{"source":true}',
  previewText: '{\n  "preview": true\n}',
  activeEditor: null as AppStatusBarActiveEditor,
  mode: TransformMode.FORMAT,
  activeFileId: 'file-1',
  files: [activeFile],
  isAutoSaveEnabled: true,
  isSourceLarge: false,
  isOutputTransforming: false,
  isAiRepairing: false,
  isAiConfigured: true,
  editorUiState: {
    hasSourceContent: true,
    isSourceJsonCandidate: true,
    sourceStandaloneDeepFormatKind: null,
  },
  sourceValidation: { isValid: true },
  sourceValidationLocation: null,
  onLocateSourceError: vi.fn(),
  onOpenSourceSchemeInput: vi.fn(),
  onOpenChangelog: vi.fn(),
  cursorLine: 2,
  cursorColumn: 8,
});

const renderStatusBar = (props = buildProps()) => {
  const tree = AppStatusBarController(props);
  if (!isElementLike(tree) || tree.type !== StatusBar) {
    throw new Error('AppStatusBarController should render StatusBar directly');
  }
  return tree;
};

describe('AppStatusBarController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useMemo.mockImplementation((factory: () => unknown) => factory());
  });

  it('默认按 SOURCE 统计，但 inputLength 始终来自 SOURCE', () => {
    const statusBar = renderStatusBar();

    expect(statusBar.props.inputLength).toBe('{"source":true}'.length);
    expect(statusBar.props.activeContentLength).toBe('{"source":true}'.length);
    expect(statusBar.props.totalLines).toBe(1);
    expect(statusBar.props.files).toEqual([activeFile]);
    expect(statusBar.props.hasSourceContent).toBe(true);
    expect(statusBar.props.cursorLine).toBe(2);
    expect(statusBar.props.cursorColumn).toBe(8);
  });

  it('PREVIEW 聚焦时按 PREVIEW 统计内容长度和行数', () => {
    const statusBar = renderStatusBar({
      ...buildProps(),
      activeEditor: 'PREVIEW',
    });

    expect(statusBar.props.inputLength).toBe('{"source":true}'.length);
    expect(statusBar.props.activeContentLength).toBe('{\n  "preview": true\n}'.length);
    expect(statusBar.props.totalLines).toBe(3);
  });

  it('包装更新日志入口，避免事件对象透传到工具面板命令', () => {
    const props = buildProps();
    const statusBar = renderStatusBar(props);

    (statusBar.props.onOpenChangelog as (event: unknown) => void)({ type: 'click' });

    expect(props.onOpenChangelog).toHaveBeenCalledWith();
  });
});
