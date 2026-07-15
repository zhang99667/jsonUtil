import { parseJsonWithFallback } from '../../utils/storage';

interface AdminResultLike {
    code?: unknown;
    message?: unknown;
    msg?: unknown;
    error?: unknown;
}

interface AdminResponseLike {
    status?: number;
    data?: unknown;
}

interface AdminRequestErrorLike {
    response?: AdminResponseLike;
    code?: string;
    message?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object'
);

const normalizeMessage = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const message = value.trim();
    return message ? message : null;
};

const getRecordMessage = (data: unknown): string | null => {
    if (!isRecord(data)) return null;

    const result = data as AdminResultLike;
    return normalizeMessage(result.message)
        || normalizeMessage(result.msg)
        || normalizeMessage(result.error);
};

const parseJsonText = (text: string): unknown | null => (
    parseJsonWithFallback<unknown>(text, null)
);

const getStatusFallbackMessage = (status?: number): string => {
    switch (status) {
        case 400:
            return '请求参数不正确，请检查后重试';
        case 401:
        case 403:
            return '登录已过期，请重新登录';
        case 404:
            return '请求的资源不存在';
        case 413:
            return '请求内容过大，请缩小文件或数据后重试';
        case 500:
            return '服务器内部错误，请稍后重试';
        case 502:
        case 503:
        case 504:
            return '服务暂不可用，请稍后重试';
        default:
            return status ? `请求失败 (${status})` : '请求错误';
    }
};

export class AdminRequestError extends Error {
    readonly status?: number;
    readonly originalError: unknown;
    readonly handledByRequestInterceptor = true;

    constructor(message: string, status?: number, originalError?: unknown) {
        super(message);
        this.name = 'AdminRequestError';
        this.status = status;
        this.originalError = originalError;
    }
}

export const isAdminRequestError = (error: unknown): error is AdminRequestError => (
    error instanceof AdminRequestError
    || (
        isRecord(error)
        && error.name === 'AdminRequestError'
        && error.handledByRequestInterceptor === true
    )
);

export const isAuthExpiredStatus = (status?: number): boolean => (
    status === 401 || status === 403
);

const readAuthorizationHeader = (headers: unknown): string | null => {
    if (!isRecord(headers)) return null;

    if (typeof headers.get === 'function') {
        return normalizeMessage(headers.get.call(headers, 'Authorization'));
    }

    return normalizeMessage(headers.Authorization)
        || normalizeMessage(headers.authorization);
};

export const shouldInvalidateAdminSession = (
    status: number | undefined,
    requestHeaders: unknown,
    currentToken: string | null
): boolean => (
    isAuthExpiredStatus(status)
    && Boolean(currentToken)
    && readAuthorizationHeader(requestHeaders) === `Bearer ${currentToken}`
);

export const getAdminResultErrorMessage = (
    result: unknown,
    fallbackMessage = '业务逻辑错误'
): string => (
    getRecordMessage(result) || fallbackMessage
);

export const readAdminResponseMessage = async (data: unknown): Promise<string | null> => {
    const recordMessage = getRecordMessage(data);
    if (recordMessage) return recordMessage;

    if (typeof Blob !== 'undefined' && data instanceof Blob) {
        const text = (await data.text()).trim();
        if (!text) return null;

        return getRecordMessage(parseJsonText(text)) || text;
    }

    if (typeof data === 'string') {
        const text = data.trim();
        if (!text) return null;

        return getRecordMessage(parseJsonText(text)) || text;
    }

    return null;
};

export const resolveAdminRequestErrorMessage = async (
    error: unknown
): Promise<string> => {
    const requestError = error as AdminRequestErrorLike;
    const status = requestError.response?.status;

    if (requestError.response) {
        const responseMessage = await readAdminResponseMessage(requestError.response.data);
        return responseMessage || getStatusFallbackMessage(status);
    }

    if (requestError.code === 'ECONNABORTED' || requestError.message?.toLowerCase().includes('timeout')) {
        return '请求超时，请稍后重试或检查后端服务状态';
    }

    if (requestError.message === 'Network Error') {
        return '网络错误，请检查网络连接或后端服务状态';
    }

    return normalizeMessage(requestError.message) || '网络错误，请检查网络连接';
};
