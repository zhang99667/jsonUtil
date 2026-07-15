import request from './request';
import { LoginFormValues } from '../../types';
import { safeRemoveStorageItem } from '../../utils/storage';

/** 登录接口的运行时响应 */
export interface LoginResponse {
    token?: unknown;
}

export const login = (data: LoginFormValues) => {
    return request.post<unknown, LoginResponse>('/auth/login', data);
};

export const logout = () => {
    safeRemoveStorageItem('token');
    window.location.href = '/admin.html';
};
