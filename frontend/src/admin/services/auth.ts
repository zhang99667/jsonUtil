import request from './request';

export const login = async (data: any) => {
    return request.post('/auth/login', data);
};

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/admin.html';
};
