import { describe, expect, it, vi } from 'vitest';
import type { FileTab } from '../types';
import { buildStatusBarViewModel, type StatusBarViewModelInput } from './statusBarViewModel';

const savedFile: FileTab = {
  id: 'file-1',
  name: 'demo.json',
  content: '{"ok":true}',
  handle: {} as FileSystemFileHandle,
  isDirty: true,
};

const schemeViewModelInput: StatusBarViewModelInput = {
  inputLength: 32,
  activeContentByteLength: 32,
  isStatsLimited: false,
  activeFileId: null,
  files: [],
  isAutoSaveEnabled: false,
  isSourceLarge: false,
  isOutputTransforming: false,
  isAiRepairing: false,
  isAiConfigured: false,
  hasSourceContent: true,
  isSourceJsonCandidate: false,
  sourceStandaloneDeepFormatKind: 'scheme',
  sourceValidation: { isValid: true },
  sourceValidationLocation: null,
};

describe('statusBarViewModel', () => {
  it('聚合当前文件、字节大小、保存状态和本地处理状态', () => {
    const viewModel = buildStatusBarViewModel({
      inputLength: 12,
      activeContentByteLength: 2048,
      isStatsLimited: true,
      activeFileId: 'file-1',
      files: [savedFile],
      isAutoSaveEnabled: true,
      isSourceLarge: true,
      isOutputTransforming: false,
      isAiRepairing: false,
      isAiConfigured: true,
      hasSourceContent: true,
      isSourceJsonCandidate: true,
      sourceStandaloneDeepFormatKind: null,
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
    });

    expect(viewModel.activeFile).toBe(savedFile);
    expect(viewModel.byteSizeText).toBe('≥2.0 KB');
    expect(viewModel.saveStatus).toMatchObject({
      label: '等待自动保存',
      title: '自动保存会在编辑停止后写入文件',
    });
    expect(viewModel.sourceValidationStatus).toMatchObject({ label: 'JSON 有效' });
    expect(viewModel.sourceValidationAction).toBeNull();
    expect(viewModel.localProcessingStatus).toMatchObject({
      label: '本地大输入',
      tone: 'large',
    });
  });

  it('SOURCE 错误定位优先于独立 Scheme 面板入口', () => {
    const onLocateSourceError = vi.fn();
    const onOpenSourceSchemeInput = vi.fn();
    const viewModel = buildStatusBarViewModel({
      inputLength: 8,
      activeContentByteLength: 8,
      isStatsLimited: false,
      activeFileId: null,
      files: [],
      isAutoSaveEnabled: false,
      isSourceLarge: false,
      isOutputTransforming: false,
      isAiRepairing: false,
      isAiConfigured: false,
      hasSourceContent: true,
      isSourceJsonCandidate: true,
      sourceStandaloneDeepFormatKind: 'scheme',
      sourceValidation: { isValid: false, error: 'Unexpected token' },
      sourceValidationLocation: { line: 2, column: 4 },
      onLocateSourceError,
      onOpenSourceSchemeInput,
    });

    expect(viewModel.activeFile).toBeNull();
    expect(viewModel.saveStatus).toMatchObject({ label: '草稿未保存' });
    expect(viewModel.sourceValidationStatus).toMatchObject({
      label: 'JSON 无效 L2:C4',
      title: 'SOURCE JSON 无效: Unexpected token',
    });
    expect(viewModel.sourceValidationAction).toMatchObject({ type: 'locate' });
    viewModel.sourceValidationAction?.onClick();
    expect(onLocateSourceError).toHaveBeenCalledTimes(1);
    expect(onOpenSourceSchemeInput).not.toHaveBeenCalled();
  });

  it('独立可解析 SOURCE Scheme 没有错误定位时提供打开入口', () => {
    const onOpenSourceSchemeInput = vi.fn();
    const viewModel = buildStatusBarViewModel({
      inputLength: 0,
      activeContentByteLength: 0,
      isStatsLimited: false,
      activeFileId: 'missing',
      files: [savedFile],
      isAutoSaveEnabled: false,
      isSourceLarge: false,
      isOutputTransforming: true,
      isAiRepairing: false,
      isAiConfigured: false,
      hasSourceContent: true,
      isSourceJsonCandidate: false,
      sourceStandaloneDeepFormatKind: 'url-encoded-scheme',
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
      onOpenSourceSchemeInput,
    });

    expect(viewModel.activeFile).toBeNull();
    expect(viewModel.saveStatus).toMatchObject({ label: '空白草稿' });
    expect(viewModel.sourceValidationStatus).toMatchObject({ label: 'SOURCE 编码Scheme' });
    expect(viewModel.sourceValidationAction).toMatchObject({ type: 'openScheme' });
    expect(viewModel.localProcessingStatus).toMatchObject({
      label: '本地 Worker',
      tone: 'worker',
    });
  });

  it('区分普通 Scheme 与 URL 编码 JSON，并保持独立输入打开入口', () => {
    const onOpenSourceSchemeInput = vi.fn();
    const schemeViewModel = buildStatusBarViewModel({
      ...schemeViewModelInput,
      onOpenSourceSchemeInput,
    });
    const encodedJsonViewModel = buildStatusBarViewModel({
      ...schemeViewModelInput,
      sourceStandaloneDeepFormatKind: 'url-encoded-json',
      onOpenSourceSchemeInput,
    });

    expect(schemeViewModel.sourceValidationStatus).toMatchObject({ label: 'SOURCE Scheme' });
    expect(schemeViewModel.sourceValidationAction).toMatchObject({ type: 'openScheme' });
    expect(encodedJsonViewModel.sourceValidationStatus).toMatchObject({ label: 'SOURCE 编码JSON' });
    expect(encodedJsonViewModel.sourceValidationAction).toMatchObject({ type: 'openScheme' });
  });

  it('AI 修复中优先展示智能修复本地处理状态', () => {
    const viewModel = buildStatusBarViewModel({
      ...schemeViewModelInput,
      isOutputTransforming: true,
      isAiRepairing: true,
      isAiConfigured: true,
    });

    expect(viewModel.localProcessingStatus).toMatchObject({
      label: '智能修复中',
      tone: 'repairing',
    });
  });
});
