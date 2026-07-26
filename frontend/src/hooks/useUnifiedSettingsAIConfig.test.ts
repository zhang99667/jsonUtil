import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProvider, type AIConfig } from '../types';
import { buildAIConfigForProviderChange } from '../utils/appSettings';
import {
  AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE,
} from '../utils/aiProviderConfigValidation';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}));
const aiServiceMocks = vi.hoisted(() => ({
  testAIConnection: vi.fn(),
}));
const recoveryMocks = vi.hoisted(() => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useEffect: reactMocks.useEffect,
  useRef: reactMocks.useRef,
  useState: reactMocks.useState,
}));
vi.mock('../services/aiService', () => aiServiceMocks);
vi.mock('../utils/chunkLoadRecoveryDispatch', () => recoveryMocks);

import { useUnifiedSettingsAIConfig } from './useUnifiedSettingsAIConfig';

type HookOptions = Parameters<typeof useUnifiedSettingsAIConfig>[0];

const createConfig = (patch: Partial<AIConfig> = {}): AIConfig => ({
  provider: AIProvider.OPENAI,
  apiKey: 'test-key',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  ...patch,
});

const haveSameDependencies = (
  current: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined
) => current?.length === next?.length
  && current?.every((dependency, index) => Object.is(dependency, next?.[index]));

const createDeferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const createHookHarness = (initialOptions: HookOptions) => {
  const states: unknown[] = [];
  const setters: Array<(value: unknown) => void> = [];
  const refs: Array<{ current: unknown }> = [];
  const callbacks: Array<{ value: unknown; dependencies: readonly unknown[] }> = [];
  const effects: Array<{
    dependencies: readonly unknown[] | undefined;
    cleanup?: () => void;
  }> = [];
  let options = initialOptions;
  let stateIndex = 0;
  let refIndex = 0;
  let callbackIndex = 0;
  let effectIndex = 0;

  reactMocks.useState.mockImplementation((initialValue: unknown) => {
    const index = stateIndex++;
    if (!(index in states)) {
      states[index] = typeof initialValue === 'function'
        ? (initialValue as () => unknown)()
        : initialValue;
      setters[index] = (value: unknown) => {
        states[index] = typeof value === 'function'
          ? (value as (current: unknown) => unknown)(states[index])
          : value;
      };
    }
    return [states[index], setters[index]];
  });
  reactMocks.useRef.mockImplementation((initialValue: unknown) => {
    const index = refIndex++;
    refs[index] ??= { current: initialValue };
    return refs[index];
  });
  reactMocks.useCallback.mockImplementation((callback, dependencies) => {
    const index = callbackIndex++;
    const current = callbacks[index];
    if (!current || !haveSameDependencies(current.dependencies, dependencies)) {
      callbacks[index] = { value: callback, dependencies };
    }
    return callbacks[index]?.value;
  });
  reactMocks.useEffect.mockImplementation((effect, dependencies) => {
    const index = effectIndex++;
    const current = effects[index];
    if (haveSameDependencies(current?.dependencies, dependencies)) return;

    current?.cleanup?.();
    const cleanup = effect();
    effects[index] = {
      dependencies,
      cleanup: typeof cleanup === 'function' ? cleanup : undefined,
    };
  });

  const useRender = (nextOptions: Partial<HookOptions> = {}) => {
    options = { ...options, ...nextOptions };
    stateIndex = 0;
    refIndex = 0;
    callbackIndex = 0;
    effectIndex = 0;
    return useUnifiedSettingsAIConfig(options);
  };

  return {
    render: useRender,
    unmount: () => effects.forEach(effect => effect.cleanup?.()),
  };
};

const createOptions = (patch: Partial<HookOptions> = {}): HookOptions => ({
  isOpen: true,
  initialConfig: createConfig(),
  onSave: vi.fn(),
  onClose: vi.fn(),
  ...patch,
});

const startPendingConnectionTest = async (
  harness: ReturnType<typeof createHookHarness>,
) => {
  const deferred = createDeferred();
  let signal: AbortSignal | undefined;
  aiServiceMocks.testAIConnection.mockImplementation((_config, options) => {
    signal = options.signal;
    return deferred.promise;
  });
  const hook = harness.render();
  const promise = hook.testConnection();
  await vi.waitFor(() => expect(signal).toBeDefined());
  return { deferred, hook, promise, signal: signal as AbortSignal };
};

describe('useUnifiedSettingsAIConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiServiceMocks.testAIConnection.mockResolvedValue(undefined);
    recoveryMocks.dispatchChunkLoadRecoveryEvent.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('打开时同步最新配置', () => {
    const firstConfig = createConfig({ model: 'first-model' });
    const nextConfig = createConfig({ model: 'next-model' });
    const harness = createHookHarness(createOptions({
      isOpen: false,
      initialConfig: firstConfig,
    }));
    harness.render();
    harness.render({ isOpen: true, initialConfig: nextConfig });

    expect(harness.render().config).toBe(nextConfig);
  });

  it('关闭时取消连接测试', async () => {
    const harness = createHookHarness(createOptions());
    const pending = await startPendingConnectionTest(harness);

    harness.render({ isOpen: false });

    expect(pending.signal.aborted).toBe(true);
    expect(harness.render().isTesting).toBe(false);
    pending.deferred.resolve();
    await pending.promise;
  });

  it('卸载时取消连接测试并忽略晚到结果', async () => {
    const harness = createHookHarness(createOptions());
    const pending = await startPendingConnectionTest(harness);

    harness.unmount();
    expect(pending.signal.aborted).toBe(true);

    pending.deferred.resolve();
    await pending.promise;
    expect(harness.render().testResult).toBeNull();
  });

  it('字段变化时取消旧测试并清空结果', async () => {
    const harness = createHookHarness(createOptions());
    const pending = await startPendingConnectionTest(harness);

    pending.hook.updateConfig({ model: 'next-model' });

    const updatedHook = harness.render();
    expect(pending.signal.aborted).toBe(true);
    expect(updatedHook.config.model).toBe('next-model');
    expect(updatedHook.testResult).toBeNull();
    pending.deferred.resolve();
    await pending.promise;
  });

  it('切换 Provider 时应用默认配置并取消旧测试', async () => {
    const initialConfig = createConfig();
    const harness = createHookHarness(createOptions({ initialConfig }));
    const pending = await startPendingConnectionTest(harness);

    pending.hook.changeProvider(AIProvider.QWEN);

    expect(pending.signal.aborted).toBe(true);
    expect(harness.render().config).toEqual(
      buildAIConfigForProviderChange(initialConfig, AIProvider.QWEN)
    );
    pending.deferred.resolve();
    await pending.promise;
  });

  it('保存校验失败时展示错误且不关闭', () => {
    const options = createOptions({
      initialConfig: createConfig({
        provider: AIProvider.CUSTOM,
        baseUrl: '',
      }),
    });
    const harness = createHookHarness(options);

    harness.render().saveConfig();

    expect(harness.render().testResult).toEqual({
      type: 'error',
      message: AI_CUSTOM_BASE_URL_REQUIRED_MESSAGE,
    });
    expect(options.onSave).not.toHaveBeenCalled();
    expect(options.onClose).not.toHaveBeenCalled();
  });

  it('配置有效时保存并关闭', () => {
    const options = createOptions();
    const harness = createHookHarness(options);

    harness.render().saveConfig();

    expect(options.onSave).toHaveBeenCalledWith(options.initialConfig);
    expect(options.onClose).toHaveBeenCalledOnce();
  });

  it('连接成功时展示通过结果', async () => {
    const harness = createHookHarness(createOptions());

    await harness.render().testConnection();

    expect(harness.render()).toMatchObject({
      isTesting: false,
      testResult: { type: 'success', message: '连接测试通过' },
    });
  });

  it('普通失败时展示原始错误消息', async () => {
    aiServiceMocks.testAIConnection.mockRejectedValue(new Error('服务暂不可用'));
    const harness = createHookHarness(createOptions());

    await harness.render().testConnection();

    expect(harness.render().testResult).toEqual({
      type: 'error',
      message: '服务暂不可用',
    });
  });

  it('分块加载失败触发恢复后不展示连接错误', async () => {
    const error = new Error('分块加载失败');
    aiServiceMocks.testAIConnection.mockRejectedValue(error);
    recoveryMocks.dispatchChunkLoadRecoveryEvent.mockReturnValue(true);
    const harness = createHookHarness(createOptions());

    await harness.render().testConnection();

    expect(recoveryMocks.dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(harness.render()).toMatchObject({
      isTesting: false,
      testResult: null,
    });
  });

  it('忽略配置变化前晚到的旧测试结果', async () => {
    const firstDeferred = createDeferred();
    const secondDeferred = createDeferred();
    aiServiceMocks.testAIConnection
      .mockImplementationOnce(() => firstDeferred.promise)
      .mockImplementationOnce(() => secondDeferred.promise);
    const harness = createHookHarness(createOptions());
    const firstHook = harness.render();
    const firstTest = firstHook.testConnection();
    await vi.waitFor(() => expect(aiServiceMocks.testAIConnection).toHaveBeenCalledTimes(1));

    firstHook.updateConfig({ apiKey: 'next-key' });
    const secondTest = harness.render().testConnection();
    await vi.waitFor(() => expect(aiServiceMocks.testAIConnection).toHaveBeenCalledTimes(2));
    secondDeferred.resolve();
    await secondTest;
    expect(harness.render().testResult?.type).toBe('success');

    firstDeferred.resolve();
    await firstTest;
    expect(harness.render().testResult).toEqual({
      type: 'success',
      message: '连接测试通过',
    });
  });
});
