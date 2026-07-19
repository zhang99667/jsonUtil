import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMocks = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}));

vi.mock('./request', () => ({
    default: requestMocks,
}));

import { downloadFile, uploadFile } from './file';

describe('文件管理服务', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('下载接口原样返回请求层提供的 Blob', async () => {
        const blob = new Blob(['{"ok":true}'], { type: 'application/json' });
        requestMocks.get.mockResolvedValue(blob);

        await expect(downloadFile(7)).resolves.toBe(blob);
        expect(requestMocks.get).toHaveBeenCalledWith('/admin/files/7/download', {
            responseType: 'blob',
        });
    });

    it('上传文件交给 Axios 和浏览器生成 multipart 请求头', async () => {
        const file = new File(['{"ok":true}'], 'sample.json', {
            type: 'application/json',
        });
        const response = { id: 7, fileName: file.name };
        requestMocks.post.mockResolvedValue(response);

        await expect(uploadFile(file)).resolves.toBe(response);

        expect(requestMocks.post).toHaveBeenCalledTimes(1);
        const [url, body, config] = requestMocks.post.mock.calls[0];
        expect(url).toBe('/admin/files/upload');
        expect(body).toBeInstanceOf(FormData);
        expect((body as FormData).get('file')).toBe(file);
        expect(config).toBeUndefined();
    });
});
