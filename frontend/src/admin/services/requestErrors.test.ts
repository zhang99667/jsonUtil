import { describe, expect, it } from 'vitest';
import {
    AdminRequestError,
    getAdminResultErrorMessage,
    isAdminRequestError,
    isAuthExpiredStatus,
    readAdminResponseMessage,
    resolveAdminRequestErrorMessage,
} from './requestErrors';

describe('getAdminResultErrorMessage', () => {
    it('优先读取后端标准 Result 的 message', () => {
        expect(getAdminResultErrorMessage({ code: 500, message: '文件不存在' })).toBe('文件不存在');
    });

    it('没有可读错误时使用业务兜底文案', () => {
        expect(getAdminResultErrorMessage({ code: 500 }, '操作失败')).toBe('操作失败');
    });
});

describe('readAdminResponseMessage', () => {
    it('读取对象错误体中的 message', async () => {
        await expect(readAdminResponseMessage({ message: '用户名已存在' })).resolves.toBe('用户名已存在');
    });

    it('读取字符串 JSON 错误体中的 message', async () => {
        await expect(readAdminResponseMessage('{"message":"参数错误"}')).resolves.toBe('参数错误');
    });

    it('读取 blob 错误体中的 message', async () => {
        const blob = new Blob([JSON.stringify({ message: '下载文件不存在' })], {
            type: 'application/json',
        });

        await expect(readAdminResponseMessage(blob)).resolves.toBe('下载文件不存在');
    });

    it('纯文本错误体直接返回文本内容', async () => {
        await expect(readAdminResponseMessage('service unavailable')).resolves.toBe('service unavailable');
    });
});

describe('resolveAdminRequestErrorMessage', () => {
    it('HTTP 错误优先展示后端 message', async () => {
        await expect(resolveAdminRequestErrorMessage({
            response: {
                status: 400,
                data: { message: '文件类型不支持' },
            },
        })).resolves.toBe('文件类型不支持');
    });

    it('HTTP 错误没有 message 时按状态码给出可操作提示', async () => {
        await expect(resolveAdminRequestErrorMessage({
            response: {
                status: 404,
                data: {},
            },
        })).resolves.toBe('请求的资源不存在');
    });

    it('识别请求超时', async () => {
        await expect(resolveAdminRequestErrorMessage({
            code: 'ECONNABORTED',
            message: 'timeout of 10000ms exceeded',
        })).resolves.toBe('请求超时，请稍后重试或检查后端服务状态');
    });

    it('识别网络断开', async () => {
        await expect(resolveAdminRequestErrorMessage({
            message: 'Network Error',
        })).resolves.toBe('网络错误，请检查网络连接或后端服务状态');
    });
});

describe('AdminRequestError', () => {
    it('标记已由请求拦截器处理的错误', () => {
        const error = new AdminRequestError('请求失败', 500);

        expect(isAdminRequestError(error)).toBe(true);
        expect(error.status).toBe(500);
    });
});

describe('isAuthExpiredStatus', () => {
    it('识别登录失效状态码', () => {
        expect(isAuthExpiredStatus(401)).toBe(true);
        expect(isAuthExpiredStatus(403)).toBe(true);
        expect(isAuthExpiredStatus(500)).toBe(false);
    });
});
