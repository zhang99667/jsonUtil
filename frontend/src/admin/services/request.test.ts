import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMocks = vi.hoisted(() => {
    const requestUse = vi.fn();
    const responseUse = vi.fn();
    return {
        create: vi.fn(() => ({
            interceptors: {
                request: { use: requestUse },
                response: { use: responseUse },
            },
        })),
        requestUse,
        responseUse,
    };
});

const messageMocks = vi.hoisted(() => ({
    error: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
    get: vi.fn(),
    remove: vi.fn(),
}));

vi.mock('axios', async importOriginal => ({
    ...await importOriginal<typeof import('axios')>(),
    default: { create: axiosMocks.create },
}));

vi.mock('antd', () => ({
    message: messageMocks,
}));

vi.mock('../../utils/storage', async importOriginal => ({
    ...await importOriginal<typeof import('../../utils/storage')>(),
    safeGetStorageItem: storageMocks.get,
    safeRemoveStorageItem: storageMocks.remove,
}));

import { AxiosHeaders } from 'axios';
import { AdminRequestError } from './requestErrors';
import './request';

type RequestFulfilled = (config: { headers: { set: (name: string, value: string) => void } }) => unknown;
type ResponseFulfilled = (response: { data: unknown }) => unknown;
type ResponseRejected = (error: unknown) => Promise<never>;

const requestFulfilled = axiosMocks.requestUse.mock.calls[0][0] as RequestFulfilled;
const responseFulfilled = axiosMocks.responseUse.mock.calls[0][0] as ResponseFulfilled;
const responseRejected = axiosMocks.responseUse.mock.calls[0][1] as ResponseRejected;

const createAxiosError = (token: string, status = 401) => ({
    isAxiosError: true,
    response: { status, data: { message: '登录已过期' } },
    config: { headers: new AxiosHeaders({ Authorization: `Bearer ${token}` }) },
});

describe('管理后台请求拦截器', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        storageMocks.get.mockReturnValue(null);
        vi.stubGlobal('window', { location: { href: '/admin.html#/traffic' } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('使用 Axios 请求头接口注入当前令牌', () => {
        const setHeader = vi.fn();
        const config = { headers: { set: setHeader } };
        storageMocks.get.mockReturnValue('current-token');

        expect(requestFulfilled(config)).toBe(config);
        expect(setHeader).toHaveBeenCalledWith('Authorization', 'Bearer current-token');
    });

    it('标准成功响应只返回 data，非标准响应保持原值', () => {
        expect(responseFulfilled({ data: { code: 200, data: { id: 7 } } })).toEqual({ id: 7 });
        expect(responseFulfilled({ data: ['raw'] })).toEqual(['raw']);
    });

    it('业务失败统一提示并包装为已处理错误', async () => {
        const response = { data: { code: 500, message: '业务失败' } };

        await expect(responseFulfilled(response)).rejects.toMatchObject({
            name: 'AdminRequestError',
            message: '业务失败',
            originalError: response,
        });
        expect(messageMocks.error).toHaveBeenCalledWith('业务失败');
    });

    it('当前会话鉴权失败时清除令牌并跳转登录页', async () => {
        storageMocks.get.mockReturnValue('current-token');

        await expect(responseRejected(createAxiosError('current-token'))).rejects.toEqual(
            expect.objectContaining<Partial<AdminRequestError>>({ status: 401 })
        );
        expect(storageMocks.remove).toHaveBeenCalledWith('token');
        expect(messageMocks.error).toHaveBeenCalledWith('登录已过期');
        expect(window.location.href).toBe('/admin.html');
    });

    it('旧会话或非 Axios 错误不能撤销当前令牌', async () => {
        storageMocks.get.mockReturnValue('current-token');

        await expect(responseRejected(createAxiosError('stale-token'))).rejects.toBeInstanceOf(AdminRequestError);
        await expect(responseRejected({
            response: { status: 401, data: { message: '伪造错误' } },
            config: { headers: { Authorization: 'Bearer current-token' } },
        })).rejects.toBeInstanceOf(AdminRequestError);

        expect(storageMocks.remove).not.toHaveBeenCalled();
        expect(window.location.href).toBe('/admin.html#/traffic');
    });

    it('敌意响应对象不会中断成功解包或错误包装', async () => {
        const responseValue = new Proxy({}, {
            has: () => { throw new Error('属性不可读'); },
        });
        const requestError = new Proxy({}, {
            get: () => { throw new Error('属性不可读'); },
            has: () => { throw new Error('属性不可读'); },
        });

        expect(responseFulfilled({ data: responseValue })).toBe(responseValue);
        await expect(responseRejected(requestError)).rejects.toMatchObject({
            name: 'AdminRequestError',
            message: '网络错误，请检查网络连接',
        });
    });
});
