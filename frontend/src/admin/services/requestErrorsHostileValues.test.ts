import { describe, expect, it } from 'vitest';
import {
    getAdminResultErrorMessage,
    isAdminRequestError,
    resolveAdminRequestErrorMessage,
    shouldInvalidateAdminSession,
} from './requestErrors';

describe('管理端敌意错误值', () => {
    it('错误体属性读取失败时使用兜底文案', () => {
        const result = Object.defineProperty({}, 'message', {
            get: () => { throw new Error('读取失败'); },
        });

        expect(getAdminResultErrorMessage(result, '操作失败')).toBe('操作失败');
    });

    it('代理对象无法读取时不误判为已处理错误', () => {
        const error = new Proxy({}, {
            getPrototypeOf: () => { throw new Error('读取失败'); },
        });

        expect(isAdminRequestError(error)).toBe(false);
    });

    it('请求错误属性读取失败时返回稳定文案', async () => {
        const error = new Proxy({}, {
            get: () => { throw new Error('读取失败'); },
        });

        await expect(resolveAdminRequestErrorMessage(error))
            .resolves.toBe('网络错误，请检查网络连接');
    });

    it('请求头读取失败时不注销当前会话', () => {
        const headers = new Proxy({}, {
            ownKeys: () => { throw new Error('读取失败'); },
        });

        expect(shouldInvalidateAdminSession(401, headers, 'current-token')).toBe(false);
    });

    it('Blob 错误体读取失败时按状态码返回兜底文案', async () => {
        const blob = new Blob(['服务异常']);
        Object.defineProperty(blob, 'text', {
            value: () => Promise.reject(new Error('读取失败')),
        });

        await expect(resolveAdminRequestErrorMessage({
            response: { status: 503, data: blob },
        })).resolves.toBe('服务暂不可用，请稍后重试');
    });
});
