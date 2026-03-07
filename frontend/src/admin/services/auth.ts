import request from './request';
import { LoginFormValues } from '../../types';

export const login = async (data: LoginFormValues) => {
    return request.post('/auth/login', data);
};

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin.html';
};
