import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
    baseURL: '/api', // Vite proxy should handle this
    timeout: 10000,
});

request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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
                message.error(res.message || '业务逻辑错误');
                return Promise.reject(new Error(res.message || 'Error'));
            }
        }
        return res;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            // 401 未认证 或 403 禁止访问（token 过期/无效也会返回 403）
            if (status === 401 || status === 403) {
                localStorage.removeItem('token');
                message.error('登录已过期，请重新登录');
                window.location.href = '/admin.html';
                return Promise.reject(error);
            }
            message.error(data.message || '请求错误');
        } else {
            message.error('网络错误，请检查网络连接');
        }
        return Promise.reject(error);
    }
);

export default request;
