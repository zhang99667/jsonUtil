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
 * TODO: 等后端实现对应 API 后替换 mock 数据
 */
export const getFileList = async (
    page: number,
    pageSize: number,
    keyword?: string,
): Promise<PageResult<FileItem>> => {
    // TODO: 后端 API 就绪后取消注释以下代码
    // return request.get('/admin/files', {
    //     params: { page, pageSize, keyword },
    // });

    // --- Mock 数据（后端 API 就绪后删除） ---
    const mockFiles: FileItem[] = [
        { id: 1, fileName: 'config.json', fileSize: 2048, fileType: 'application/json', uploadTime: '2026-03-07 10:30:00', uploader: 'admin' },
        { id: 2, fileName: 'data-export.json', fileSize: 15360, fileType: 'application/json', uploadTime: '2026-03-06 14:20:00', uploader: 'admin' },
        { id: 3, fileName: 'schema-definition.json', fileSize: 4096, fileType: 'application/json', uploadTime: '2026-03-05 09:15:00', uploader: 'user1' },
        { id: 4, fileName: 'api-response-sample.json', fileSize: 8192, fileType: 'application/json', uploadTime: '2026-03-04 16:45:00', uploader: 'admin' },
        { id: 5, fileName: 'i18n-zh-CN.json', fileSize: 3072, fileType: 'application/json', uploadTime: '2026-03-03 11:00:00', uploader: 'user2' },
        { id: 6, fileName: 'package.json', fileSize: 1024, fileType: 'application/json', uploadTime: '2026-03-02 08:30:00', uploader: 'admin' },
        { id: 7, fileName: 'tsconfig.json', fileSize: 512, fileType: 'application/json', uploadTime: '2026-03-01 17:20:00', uploader: 'admin' },
        { id: 8, fileName: 'user-preferences.json', fileSize: 6144, fileType: 'application/json', uploadTime: '2026-02-28 13:10:00', uploader: 'user1' },
        { id: 9, fileName: 'test-fixtures.json', fileSize: 20480, fileType: 'application/json', uploadTime: '2026-02-27 15:50:00', uploader: 'user2' },
        { id: 10, fileName: 'swagger-spec.json', fileSize: 51200, fileType: 'application/json', uploadTime: '2026-02-26 10:00:00', uploader: 'admin' },
        { id: 11, fileName: 'env-config.json', fileSize: 768, fileType: 'application/json', uploadTime: '2026-02-25 09:00:00', uploader: 'admin' },
        { id: 12, fileName: 'mock-data.json', fileSize: 12288, fileType: 'application/json', uploadTime: '2026-02-24 14:30:00', uploader: 'user1' },
    ];

    // 模拟搜索过滤
    const filtered = keyword
        ? mockFiles.filter((f) => f.fileName.toLowerCase().includes(keyword.toLowerCase()))
        : mockFiles;

    // 模拟分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return Promise.resolve({
        list: filtered.slice(start, end),
        total: filtered.length,
    });
};

/**
 * 获取文件内容（用于预览）
 * TODO: 等后端实现对应 API 后替换 mock 数据
 */
export const getFileContent = async (fileId: number): Promise<string> => {
    // TODO: 后端 API 就绪后取消注释以下代码
    // return request.get(`/admin/files/${fileId}/content`);

    // --- Mock 数据（后端 API 就绪后删除） ---
    const mockContent: Record<number, string> = {
        1: JSON.stringify({ appName: 'JSON Utils', version: '1.0.0', debug: false, features: { aiRepair: true, jsonPath: true } }, null, 2),
        2: JSON.stringify({ users: [{ id: 1, name: '张三' }, { id: 2, name: '李四' }], exportTime: '2026-03-06T14:20:00Z' }, null, 2),
        3: JSON.stringify({ $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } }, null, 2),
    };
    return Promise.resolve(mockContent[fileId] || JSON.stringify({ message: '文件内容预览示例', id: fileId }, null, 2));
};

/**
 * 下载文件
 * TODO: 等后端实现对应 API 后替换 mock 逻辑
 */
export const downloadFile = async (fileId: number, fileName: string): Promise<void> => {
    // TODO: 后端 API 就绪后取消注释以下代码
    // const response = await request.get(`/admin/files/${fileId}/download`, {
    //     responseType: 'blob',
    // });
    // const url = window.URL.createObjectURL(new Blob([response]));
    // const link = document.createElement('a');
    // link.href = url;
    // link.setAttribute('download', fileName);
    // document.body.appendChild(link);
    // link.click();
    // link.remove();
    // window.URL.revokeObjectURL(url);

    // --- Mock 逻辑（后端 API 就绪后删除） ---
    const content = await getFileContent(fileId);
    const blob = new Blob([content], { type: 'application/json' });
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
 * TODO: 等后端实现对应 API 后替换 mock 逻辑
 */
export const deleteFile = async (fileId: number): Promise<void> => {
    // TODO: 后端 API 就绪后取消注释以下代码
    // return request.delete(`/admin/files/${fileId}`);

    // --- Mock 逻辑（后端 API 就绪后删除） ---
    return Promise.resolve();
};
