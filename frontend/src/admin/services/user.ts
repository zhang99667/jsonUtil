import request from './request';

export const addUser = async (data: any) => {
    return request.post('/admin/users/add', data);
};
