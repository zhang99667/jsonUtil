import axios from 'axios';
import { message } from 'antd';
import {
    readObjectPropertySafely,
    safeGetStorageItem,
    safeRemoveStorageItem,
} from '../../utils/storage';
import {
    AdminRequestError,
    getAdminResultErrorMessage,
    resolveAdminRequestErrorMessage,
    shouldInvalidateAdminSession,
} from './requestErrors';

const request = axios.create({ baseURL: '/api', timeout: 10000 });

request.interceptors.request.use((config) => {
    const token = safeGetStorageItem('token');
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
});

request.interceptors.response.use(
    (response) => {
        const result = response.data;
        const code = readObjectPropertySafely(result, 'code');
        // 标准 Result 响应只向业务层返回 data 字段
        if (code === undefined) return result;
        if (code === 200) return readObjectPropertySafely(result, 'data');

        const errorMessage = getAdminResultErrorMessage(result);
        message.error(errorMessage);
        return Promise.reject(new AdminRequestError(errorMessage, undefined, response));
    },
    async (error: unknown) => {
        const isAxiosError = readObjectPropertySafely(error, 'isAxiosError') === true;
        const response = isAxiosError ? readObjectPropertySafely(error, 'response') : null;
        const statusValue = readObjectPropertySafely(response, 'status');
        const status = typeof statusValue === 'number' ? statusValue : undefined;
        const config = isAxiosError ? readObjectPropertySafely(error, 'config') : null;
        const requestHeaders = readObjectPropertySafely(config, 'headers');
        const errorMessage = await resolveAdminRequestErrorMessage(error);
        const currentToken = safeGetStorageItem('token');
        const shouldInvalidateSession = shouldInvalidateAdminSession(
            status,
            requestHeaders,
            currentToken
        );

        // 只有当前会话发出的鉴权失败可以撤销当前令牌，避免迟到响应误伤新会话
        if (shouldInvalidateSession) safeRemoveStorageItem('token');

        message.error(errorMessage);
        if (shouldInvalidateSession) window.location.href = '/admin.html';
        return Promise.reject(new AdminRequestError(errorMessage, status, error));
    }
);

export default request;
