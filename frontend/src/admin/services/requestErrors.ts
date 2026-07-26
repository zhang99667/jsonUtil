import { AxiosHeaders, type RawAxiosHeaders } from 'axios';
import { isRecord, parseJsonWithFallback, readObjectPropertySafely } from '../../utils/storage';

const normalizeMessage = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const message = value.trim();
    return message ? message : null;
};

const isBlob = (value: unknown): value is Blob => {
    try {
        return typeof Blob !== 'undefined' && value instanceof Blob;
    } catch {
        return false;
    }
};

const getRecordMessage = (data: unknown): string | null => {
    if (isBlob(data) || !isRecord(data)) return null;

    return normalizeMessage(readObjectPropertySafely(data, 'message'))
        || normalizeMessage(readObjectPropertySafely(data, 'msg'))
        || normalizeMessage(readObjectPropertySafely(data, 'error'));
};

const parseJsonText = (text: string): unknown | null => parseJsonWithFallback<unknown>(text, null);

const STATUS_FALLBACK_MESSAGES = new Map<number, string>([
    [400, '请求参数不正确，请检查后重试'],
    [401, '登录已过期，请重新登录'],
    [403, '登录已过期，请重新登录'],
    [404, '请求的资源不存在'],
    [413, '请求内容过大，请缩小文件或数据后重试'],
    [500, '服务器内部错误，请稍后重试'],
    [502, '服务暂不可用，请稍后重试'],
    [503, '服务暂不可用，请稍后重试'],
    [504, '服务暂不可用，请稍后重试'],
]);

const getStatusFallbackMessage = (status?: number): string => (
    status ? STATUS_FALLBACK_MESSAGES.get(status) || `请求失败 (${status})` : '请求错误'
);

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
    !isBlob(error)
    && isRecord(error)
    && readObjectPropertySafely(error, 'name') === 'AdminRequestError'
    && readObjectPropertySafely(error, 'handledByRequestInterceptor') === true
);

export const isAuthExpiredStatus = (status?: number): boolean => status === 401 || status === 403;

const readAuthorizationHeader = (headers: unknown): string | null => {
    if (!isRecord(headers)) return null;

    try {
        // 使用 Axios 的标准请求头模型统一处理实例、原始对象和键名大小写。
        return normalizeMessage(AxiosHeaders.from(headers as RawAxiosHeaders).get('Authorization'));
    } catch {
        return null;
    }
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
    if (isBlob(data)) {
        let text: string;
        try {
            text = (await data.text()).trim();
        } catch {
            return null;
        }
        if (!text) return null;

        return getRecordMessage(parseJsonText(text)) || text;
    }

    const recordMessage = getRecordMessage(data);
    if (recordMessage) return recordMessage;

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
    const requestError = isRecord(error) ? error : null;
    const responseValue = readObjectPropertySafely(requestError, 'response');
    const response = isRecord(responseValue) ? responseValue : null;
    const statusValue = readObjectPropertySafely(response, 'status');
    const status = typeof statusValue === 'number' ? statusValue : undefined;

    if (response) {
        const responseMessage = await readAdminResponseMessage(readObjectPropertySafely(response, 'data'));
        return responseMessage || getStatusFallbackMessage(status);
    }

    const errorMessage = normalizeMessage(readObjectPropertySafely(requestError, 'message'));
    if (readObjectPropertySafely(requestError, 'code') === 'ECONNABORTED'
        || errorMessage?.toLowerCase().includes('timeout')) {
        return '请求超时，请稍后重试或检查后端服务状态';
    }

    if (errorMessage === 'Network Error') {
        return '网络错误，请检查网络连接或后端服务状态';
    }

    return errorMessage || '网络错误，请检查网络连接';
};
