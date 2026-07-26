import { describe, expect, it, vi } from 'vitest';
import { uploadFileWithState } from './FileManagement';

describe('文件管理上传状态', () => {
    it('上传失败后恢复上传状态并保留原始文件引用', async () => {
        const file = new File(['{}'], 'payload.json', { type: 'application/json' });
        const error = new Error('上传失败');
        const upload = vi.fn().mockRejectedValue(error);
        const setUploading = vi.fn();

        await expect(uploadFileWithState(file, upload, setUploading)).rejects.toBe(error);

        expect(upload).toHaveBeenCalledWith(file);
        expect(setUploading.mock.calls).toEqual([[true], [false]]);
    });
});
