import request from './request';

/**
 * 用户数据接口
 */
export interface UserRecord {
    id: number;
    username: string;
    email: string | null;
    role: string;
    enabled: boolean;
    createdAt: string;
}

/**
 * 分页响应接口
 */
export interface PageResult<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

/**
 * 添加用户参数
 */
export interface AddUserParams {
    username: string;
    password: string;
    role: string;
}

/**
 * 更新用户参数
 */
export interface UpdateUserParams {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    enabled?: boolean;
}

/**
 * 添加用户
 */
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

/**
 * 更新用户信息
 */
export const updateUser = async (id: number, data: UpdateUserParams) => {
    return request.put(`/admin/users/${id}`, data);
};

/**
 * 删除用户
 */
export const deleteUser = async (id: number) => {
    return request.delete(`/admin/users/${id}`);
};

/**
 * 切换用户启用/禁用状态
 */
export const toggleUserEnabled = async (id: number) => {
    return request.put(`/admin/users/${id}/toggle-enabled`);
};
