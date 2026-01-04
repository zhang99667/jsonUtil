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
        return response.data;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401) {
                localStorage.removeItem('token');
                // Optional: Redirect to login or dispatch clearer action
                window.location.href = '/admin.html';
            }
            message.error(data.message || 'Request Error');
        } else {
            message.error('Network Error');
        }
        return Promise.reject(error);
    }
);

export default request;
