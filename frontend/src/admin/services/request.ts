import axios from 'axios';
import { message } from 'antd';
import { safeGetStorageItem, safeRemoveStorageItem } from '../../utils/storage';
import {
    AdminRequestError,
    getAdminResultErrorMessage,
    isAuthExpiredStatus,
    resolveAdminRequestErrorMessage,
} from './requestErrors';

const request = axios.create({
    baseURL: '/api', // Vite proxy should handle this
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
        // If it's a standard Result object
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

        // 401 未认证 或 403 禁止访问（token 过期/无效也会返回 403）
        if (isAuthExpiredStatus(status)) {
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
