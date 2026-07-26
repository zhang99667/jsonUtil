import { AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import {
    AdminRequestError,
    getAdminResultErrorMessage,
    isAdminRequestError,
    isAuthExpiredStatus,
    readAdminResponseMessage,
    resolveAdminRequestErrorMessage,
    shouldInvalidateAdminSession,
} from './requestErrors';

describe('getAdminResultErrorMessage', () => {
    it('优先读取后端标准 Result 的 message', () => {
        expect(getAdminResultErrorMessage({ code: 500, message: '文件不存在' })).toBe('文件不存在');
    });

    it('忽略数组和空值等非错误记录', () => {
        expect(getAdminResultErrorMessage([{ message: '数组内错误' }], '操作失败')).toBe('操作失败');
        expect(getAdminResultErrorMessage(null, '操作失败')).toBe('操作失败');
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
        const blob = Object.assign(
            new Blob([JSON.stringify({ message: '下载文件不存在' })], {
                type: 'application/json',
            }),
            { message: '不应读取的附加属性' }
        );

        await expect(readAdminResponseMessage(blob)).resolves.toBe('下载文件不存在');
    });

    it('纯文本错误体直接返回文本内容', async () => {
        await expect(readAdminResponseMessage('service unavailable')).resolves.toBe('service unavailable');
    });

    it('数组和空值不会被当作对象错误体', async () => {
        await expect(readAdminResponseMessage([{ message: '数组内错误' }])).resolves.toBeNull();
        await expect(readAdminResponseMessage(null)).resolves.toBeNull();
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

    it('未知拒绝值使用稳定网络错误提示', async () => {
        await expect(resolveAdminRequestErrorMessage(null)).resolves.toBe('网络错误，请检查网络连接');
        await expect(resolveAdminRequestErrorMessage(undefined)).resolves.toBe('网络错误，请检查网络连接');
    });
});

describe('AdminRequestError', () => {
    it('标记已由请求拦截器处理的错误', () => {
        const error = new AdminRequestError('请求失败', 500);

        expect(isAdminRequestError(error)).toBe(true);
        expect(error.status).toBe(500);
    });

    it('拒绝数组、空值和伪装成请求错误的 Blob', () => {
        const blob = Object.assign(new Blob(['请求失败']), {
            name: 'AdminRequestError',
            handledByRequestInterceptor: true,
        });

        expect(isAdminRequestError([])).toBe(false);
        expect(isAdminRequestError(null)).toBe(false);
        expect(isAdminRequestError(blob)).toBe(false);
    });
});

describe('isAuthExpiredStatus', () => {
    it('识别登录失效状态码', () => {
        expect(isAuthExpiredStatus(401)).toBe(true);
        expect(isAuthExpiredStatus(403)).toBe(true);
        expect(isAuthExpiredStatus(500)).toBe(false);
    });
});

describe('shouldInvalidateAdminSession', () => {
    it('只有当前会话发出的鉴权失败才使令牌失效', () => {
        expect(shouldInvalidateAdminSession(
            401,
            { Authorization: 'Bearer current-token' },
            'current-token'
        )).toBe(true);
        expect(shouldInvalidateAdminSession(401, {}, 'current-token')).toBe(false);
        expect(shouldInvalidateAdminSession(
            403,
            { Authorization: 'Bearer stale-token' },
            'current-token'
        )).toBe(false);
        expect(shouldInvalidateAdminSession(
            500,
            { Authorization: 'Bearer current-token' },
            'current-token'
        )).toBe(false);
    });

    it('复用 Axios 请求头模型处理实例、大小写并忽略非字符串值', () => {
        const axiosHeaders = new AxiosHeaders({ authorization: 'Bearer current-token' });
        const uppercaseHeaders = { AUTHORIZATION: 'Bearer current-token' };
        const multiValueHeaders = { Authorization: ['Bearer current-token'] };

        expect(shouldInvalidateAdminSession(401, axiosHeaders, 'current-token')).toBe(true);
        expect(shouldInvalidateAdminSession(401, uppercaseHeaders, 'current-token')).toBe(true);
        expect(shouldInvalidateAdminSession(401, multiValueHeaders, 'current-token')).toBe(false);
    });
});
