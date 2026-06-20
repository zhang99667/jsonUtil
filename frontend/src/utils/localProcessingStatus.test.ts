import { describe, expect, it } from 'vitest';
import { getLocalProcessingStatus } from './localProcessingStatus';

describe('getLocalProcessingStatus', () => {
  it('默认说明常用工具在浏览器本地执行', () => {
    expect(getLocalProcessingStatus({
      hasSourceContent: false,
      isSourceLarge: false,
      isOutputTransforming: false,
      isAiRepairing: false,
      isAiConfigured: false,
    })).toMatchObject({
      label: '本地处理',
      tone: 'local',
      title: expect.stringContaining('格式化、压缩、深度解析、结构导航、JSONPath、Schema 和类型生成默认在浏览器本地执行'),
    });
  });

  it('大输入时提示本地保护策略', () => {
    const status = getLocalProcessingStatus({
      hasSourceContent: true,
      isSourceLarge: true,
      isOutputTransforming: false,
      isAiRepairing: false,
      isAiConfigured: true,
    });

    expect(status).toMatchObject({
      label: '本地大输入',
      tone: 'large',
      title: expect.stringContaining('Worker、采样或结果上限保护'),
    });
    expect(status.title).toContain('只有手动触发智能修复且本地规则无法修复时才可能调用模型');
  });

  it('Worker 处理中优先提示本地 Worker', () => {
    expect(getLocalProcessingStatus({
      hasSourceContent: true,
      isSourceLarge: true,
      isOutputTransforming: true,
      isAiRepairing: false,
      isAiConfigured: true,
    })).toMatchObject({
      label: '本地 Worker',
      tone: 'worker',
      title: expect.stringContaining('不会发送到 AI'),
    });
  });

  it('智能修复中优先说明本地规则和 AI 边界', () => {
    expect(getLocalProcessingStatus({
      hasSourceContent: true,
      isSourceLarge: true,
      isOutputTransforming: true,
      isAiRepairing: true,
      isAiConfigured: true,
    })).toMatchObject({
      label: '智能修复中',
      tone: 'repairing',
      title: expect.stringContaining('本地可修不会发送到模型'),
    });
  });
});
