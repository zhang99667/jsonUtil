import type { UpdateUserParams, UserRole } from '../services/user';

const USER_CREATED_AT_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

export interface EditUserFormValues {
    username: string;
    email?: string;
    password?: string;
    role: UserRole;
}

export const formatUserCreatedAt = (source: string | null | undefined): string => {
    if (!source) return '-';
    const date = new Date(source);
    return Number.isNaN(date.getTime()) ? '-' : USER_CREATED_AT_FORMATTER.format(date);
};

export const buildUpdateUserParams = (
    values: EditUserFormValues
): UpdateUserParams => {
    const params: UpdateUserParams = {
        username: values.username,
        email: values.email || undefined,
        role: values.role,
    };
    if (values.password?.trim()) {
        params.password = values.password;
    }
    return params;
};
