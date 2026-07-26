import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showError } from '../../utils/toast';
import { AdminRequestError } from '../services/requestErrors';
import {
    handleUserManagementRequestError,
    isUserFormValidationError,
} from './UserManagementErrors';

vi.mock('../../utils/toast', () => ({
    showError: vi.fn(),
}));

describe('用户管理异常边界', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('请求层已处理的标准错误不重复提示', () => {
        const logError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        handleUserManagementRequestError(
            new AdminRequestError('请求失败', 500),
            '用户删除失败',
            '删除用户',
        );

        expect(showError).not.toHaveBeenCalled();
        expect(logError).not.toHaveBeenCalled();
        logError.mockRestore();
    });

    it('未知异常使用中文兜底提示并记录操作日志', () => {
        const error = new Error('unexpected');
        const logError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        handleUserManagementRequestError(error, '用户删除失败', '删除用户');

        expect(showError).toHaveBeenCalledWith('用户删除失败');
        expect(logError).toHaveBeenCalledWith('删除用户失败:', error);
        logError.mockRestore();
    });

    it('只把表单字段错误识别为可忽略的校验失败', () => {
        expect(isUserFormValidationError({
            values: { username: '' },
            errorFields: [{
                name: ['username'],
                errors: ['请输入用户名'],
                warnings: [],
            }],
            outOfDate: false,
        })).toBe(true);
        expect(isUserFormValidationError(new Error('运行时异常'))).toBe(false);
        expect(isUserFormValidationError({ errorFields: [] })).toBe(false);
        expect(isUserFormValidationError({ errorFields: '非法结构' })).toBe(false);
    });
});
