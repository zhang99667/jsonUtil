import request from './request';

/**
 * 文件管理相关类型定义
 */

/** 文件信息 */
export interface FileItem {
    id: number;
    /** 文件名 */
    fileName: string;
    /** 文件大小（字节） */
    fileSize: number;
    /** 文件MIME类型 */
    fileType: string;
    /** 上传时间 */
    uploadTime: string;
    /** 上传者 */
    uploader: string;
}

/** 分页响应 */
export interface PageResult<T> {
    list: T[];
    total: number;
}

/**
 * 获取文件列表（分页 + 搜索）
 */
export const getFileList = async (
    page: number,
    pageSize: number,
    keyword?: string,
): Promise<PageResult<FileItem>> => {
    return request.get('/admin/files', {
        params: { page, pageSize, keyword },
    });
};

/**
 * 获取文件内容（用于预览）
 */
export const getFileContent = async (fileId: number): Promise<string> => {
    return request.get(`/admin/files/${fileId}/content`);
};

/**
 * 下载文件
 */
export const downloadFile = async (fileId: number, fileName: string): Promise<void> => {
    const response = await request.get(`/admin/files/${fileId}/download`, {
        responseType: 'blob',
    });
    const blob = new Blob([response as unknown as BlobPart]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * 删除文件
 */
export const deleteFile = async (fileId: number): Promise<void> => {
    return request.delete(`/admin/files/${fileId}`);
};

/**
 * 上传文件
 */
export const uploadFile = async (file: File): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/admin/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};
