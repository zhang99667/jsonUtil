import axios from 'axios';
import { message } from 'antd';
import { safeGetStorageItem, safeRemoveStorageItem } from '../../utils/storage';
import {
    AdminRequestError,
    getAdminResultErrorMessage,
    resolveAdminRequestErrorMessage,
    shouldInvalidateAdminSession,
} from './requestErrors';

const request = axios.create({
    baseURL: '/api', // 本地开发请求由 Vite 代理转发
    timeout: 10000,
});

request.interceptors.request.use(
    (config) => {
        const token = safeGetStorageItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

request.interceptors.response.use(
    (response) => {
        const res = response.data;
        // 标准 Result 响应只向业务层返回 data 字段
        if (res && typeof res === 'object' && 'code' in res) {
            if (res.code === 200) {
                return res.data;
            } else {
                const errorMessage = getAdminResultErrorMessage(res);
                message.error(errorMessage);
                return Promise.reject(new AdminRequestError(errorMessage, undefined, response));
            }
        }
        return res;
    },
    async (error) => {
        const status = error.response?.status as number | undefined;
        const errorMessage = await resolveAdminRequestErrorMessage(error);
        const currentToken = safeGetStorageItem('token');

        // 只有当前会话发出的鉴权失败可以撤销当前令牌，避免迟到响应误伤新会话
        if (shouldInvalidateAdminSession(status, error.config?.headers, currentToken)) {
            safeRemoveStorageItem('token');
            message.error(errorMessage);
            window.location.href = '/admin.html';
            return Promise.reject(new AdminRequestError(errorMessage, status, error));
        }

        message.error(errorMessage);
        return Promise.reject(new AdminRequestError(errorMessage, status, error));
    }
);

export default request;
