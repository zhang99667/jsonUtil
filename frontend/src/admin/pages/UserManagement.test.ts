import { describe, expect, it } from 'vitest';
import {
    buildUpdateUserParams,
    formatUserCreatedAt,
} from './UserManagementModel';

describe('UserManagement 边界处理', () => {
    it('空值和非法创建时间统一显示占位符', () => {
        expect(formatUserCreatedAt('')).toBe('-');
        expect(formatUserCreatedAt(null)).toBe('-');
        expect(formatUserCreatedAt(undefined)).toBe('-');
        expect(formatUserCreatedAt('not-a-date')).toBe('-');
    });

    it('合法创建时间使用中文日期格式且不泄露英文错误文本', () => {
        const formatted = formatUserCreatedAt('2025-01-15T10:30:00');

        expect(formatted).not.toBe('-');
        expect(formatted).not.toContain('Invalid Date');
        expect(formatted).toContain('2025');
    });

    it.each(['', '   ', '\u3000\u2003'])('编辑时不提交空密码或纯空白密码', (password) => {
        const baseValues = {
            username: 'admin',
            email: '',
            role: 'ADMIN' as const,
        };

        expect(buildUpdateUserParams({ ...baseValues, password })).not.toHaveProperty('password');
    });

    it('编辑时保留用户实际输入的新密码', () => {
        expect(buildUpdateUserParams({
            username: 'admin',
            email: 'admin@example.com',
            role: 'ADMIN',
            password: ' new-password ',
        })).toEqual({
            username: 'admin',
            email: 'admin@example.com',
            role: 'ADMIN',
            password: ' new-password ',
        });
    });

});
