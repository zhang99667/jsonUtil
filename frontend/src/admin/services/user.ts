import request from './request';

export type UserRole = 'USER' | 'ADMIN';

export interface UserRecord {
    id: number;
    username: string;
    email: string | null;
    role: UserRole;
    enabled: boolean;
    createdAt: string | null;
}

export interface PageResult<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface AddUserParams {
    username: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserParams {
    username?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    enabled?: boolean;
}

export const addUser = async (data: AddUserParams) => {
    return request.post('/admin/users/add', data);
};

/**
 * 分页获取用户列表
 * @param page 页码（从 0 开始）
 * @param size 每页条数
 * @param keyword 搜索关键词（按用户名模糊匹配）
 */
export const getUserList = async (page: number, size: number, keyword?: string): Promise<PageResult<UserRecord>> => {
    const params: Record<string, string | number> = { page, size };
    if (keyword) {
        params.keyword = keyword;
    }
    return request.get('/admin/users', { params });
};

export const updateUser = async (id: number, data: UpdateUserParams) => {
    return request.put(`/admin/users/${id}`, data);
};

export const deleteUser = async (id: number) => {
    return request.delete(`/admin/users/${id}`);
};
