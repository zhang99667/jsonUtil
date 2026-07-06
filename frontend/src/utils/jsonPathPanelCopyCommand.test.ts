import { describe, expect, it, vi } from 'vitest';
import {
  runJsonPathPathValueCopyCommand,
  runJsonPathValueCopyCommand,
} from './jsonPathPanelCopyCommand';

const createCopyEffects = () => ({
  copyText: vi.fn<(_: string) => Promise<void>>().mockResolvedValue(undefined),
  onShowSuccess: vi.fn(),
  onShowError: vi.fn(),
  onLogWarning: vi.fn(),
});

describe('jsonPathPanelCopyCommand', () => {
  it('复制查询值时写入格式化文本并提示数量', async () => {
    const effects = createCopyEffects();

    await expect(runJsonPathValueCopyCommand({
      values: [{ id: 1 }],
      isResultLimited: false,
    }, effects)).resolves.toBe(true);

    expect(effects.copyText).toHaveBeenCalledWith(`{
  "id": 1
}`);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('查询结果已复制（1 项）');
    expect(effects.onShowError).not.toHaveBeenCalled();
  });

  it('复制路径和值时使用行格式并保留截断提示', async () => {
    const effects = createCopyEffects();

    await runJsonPathPathValueCopyCommand({
      items: [{ path: '$.name', value: 'Ada', range: null, pointer: '/name' }],
      isResultLimited: true,
    }, effects);

    expect(effects.copyText).toHaveBeenCalledWith('$.name = "Ada"');
    expect(effects.onShowSuccess).toHaveBeenCalledWith('查询路径和值已复制（已返回 1 项）');
  });

  it('空结果不触发剪贴板和提示', async () => {
    const effects = createCopyEffects();

    await expect(runJsonPathValueCopyCommand({ values: [], isResultLimited: false }, effects)).resolves.toBe(false);

    expect(effects.copyText).not.toHaveBeenCalled();
    expect(effects.onShowSuccess).not.toHaveBeenCalled();
    expect(effects.onShowError).not.toHaveBeenCalled();
  });

  it('复制失败时输出错误提示并保留调试日志', async () => {
    const effects = createCopyEffects();
    effects.copyText.mockRejectedValueOnce(new Error('denied'));

    await expect(runJsonPathPathValueCopyCommand({
      items: [{ path: '$.name', value: 'Ada', range: null, pointer: '/name' }],
      isResultLimited: false,
    }, effects)).resolves.toBe(false);

    expect(effects.onLogWarning).toHaveBeenCalledWith('复制 JSONPath 查询路径和值失败:', expect.any(Error));
    expect(effects.onShowError).toHaveBeenCalledWith('denied');
  });
});
