import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import {
  getStatusBarByteSizeText,
  getStatusBarSaveStatus,
  getStatusBarSourceValidationStatus,
  STATUS_BAR_MODE_LABELS,
} from './statusBarState';

describe('statusBarState', () => {
  it('生成草稿和文件保存状态', () => {
    expect(getStatusBarSaveStatus({
      hasActiveFile: false,
      isSavedFile: false,
      isDirty: false,
      inputLength: 8,
      isAutoSaveEnabled: false,
    })).toMatchObject({
      label: '草稿未保存',
      className: 'bg-yellow-100 text-yellow-800',
    });

    expect(getStatusBarSaveStatus({
      hasActiveFile: true,
      isSavedFile: true,
      isDirty: false,
      inputLength: 8,
      isAutoSaveEnabled: true,
    })).toMatchObject({
      label: '自动保存已同步',
      title: '当前文件修改已自动同步',
    });

    expect(getStatusBarSaveStatus({
      hasActiveFile: true,
      isSavedFile: true,
      isDirty: true,
      inputLength: 8,
      isAutoSaveEnabled: true,
    })).toMatchObject({
      label: '等待自动保存',
      title: '自动保存会在编辑停止后写入文件',
    });
  });

  it('区分 SOURCE 空、普通文本和可独立解析的 Scheme 输入', () => {
    expect(getStatusBarSourceValidationStatus({
      hasSourceContent: false,
      isSourceJsonCandidate: false,
      sourceStandaloneDeepFormatKind: null,
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
    })).toMatchObject({
      label: 'SOURCE 空',
      title: 'SOURCE 为空，输入 JSON 后会展示校验状态',
    });

    expect(getStatusBarSourceValidationStatus({
      hasSourceContent: true,
      isSourceJsonCandidate: false,
      sourceStandaloneDeepFormatKind: null,
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
    })).toMatchObject({
      label: 'SOURCE 文本',
    });

    expect(getStatusBarSourceValidationStatus({
      hasSourceContent: true,
      isSourceJsonCandidate: false,
      sourceStandaloneDeepFormatKind: 'url-encoded-scheme',
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
    })).toMatchObject({
      label: 'SOURCE 编码Scheme',
      title: '当前 SOURCE 是 URL 编码 CMD/Scheme，已按深度解析处理',
    });
  });

  it('展示 JSON 校验状态和错误定位', () => {
    expect(getStatusBarSourceValidationStatus({
      hasSourceContent: true,
      isSourceJsonCandidate: true,
      sourceStandaloneDeepFormatKind: null,
      sourceValidation: { isValid: true },
      sourceValidationLocation: null,
    })).toMatchObject({
      label: 'JSON 有效',
      className: 'bg-green-100 text-green-800',
    });

    expect(getStatusBarSourceValidationStatus({
      hasSourceContent: true,
      isSourceJsonCandidate: true,
      sourceStandaloneDeepFormatKind: null,
      sourceValidation: { isValid: false, error: 'Unexpected token' },
      sourceValidationLocation: { line: 3, column: 12 },
    })).toMatchObject({
      label: 'JSON 无效 L3:C12',
      title: 'SOURCE JSON 无效: Unexpected token',
    });
  });

  it('复用统一的字节大小和模式文案', () => {
    expect(getStatusBarByteSizeText(1536, false)).toBe('1.5 KB');
    expect(getStatusBarByteSizeText(1536, true)).toBe('≥1.5 KB');
    expect(STATUS_BAR_MODE_LABELS[TransformMode.JSON_TO_TYPESCRIPT]).toBe('JSON 转 TS');
  });
});
