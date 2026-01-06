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
            if (status === 401) {
                localStorage.removeItem('token');
                // Optional: Redirect to login or dispatch clearer action
                window.location.href = '/admin.html';
            }
            message.error(data.message || '请求错误');
        } else {
            message.error('网络错误，请检查网络连接');
        }
        return Promise.reject(error);
    }
);

export default request;
