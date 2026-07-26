import React, { useState, useEffect, useRef } from 'react';
import { Table, Input, Button, Modal, Popconfirm, message, Space, Tag, Typography, Tooltip, Upload } from 'antd';
import {
    FileOutlined,
    EyeOutlined,
    DownloadOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import {
    getFileList,
    getFileContent,
    downloadFile,
    deleteFile,
    uploadFile,
    FileItem,
} from '../services/file';
import { isAdminRequestError } from '../services/requestErrors';
import { triggerBlobDownload } from '../../utils/browserFileSave';
import { getErrorMessage } from '../../utils/errors';
import { formatFileSize, TEXT_FILE_ACCEPT_EXTENSIONS } from '../../utils/fileGuards';
import { createAdminListRequestController } from '../utils/listRequestController';

const { Title } = Typography;
const { Search } = Input;

/** 默认每页条数 */
const DEFAULT_PAGE_SIZE = 10;

export const uploadFileWithState = async (
    file: File,
    upload: (selectedFile: File) => Promise<unknown>,
    setUploading: (uploading: boolean) => void,
): Promise<void> => {
    setUploading(true);
    try {
        await upload(file);
    } finally {
        setUploading(false);
    }
};

/** 根据文件类型返回标签颜色 */
const getFileTypeColor = (fileType: string): string => {
    if (fileType.includes('json')) return 'blue';
    if (fileType.includes('xml')) return 'orange';
    if (fileType.includes('text')) return 'green';
    if (fileType.includes('csv')) return 'purple';
    return 'default';
};

const FileManagement: React.FC = () => {
    const [fileList, setFileList] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 });
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [previewFileName, setPreviewFileName] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const previewRequestIdRef = useRef(0);
    const [fileListController] = useState(() => createAdminListRequestController({
        initialQuery: {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            keyword: '',
        },
        loadPage: async (query) => {
            const result = await getFileList(
                query.page,
                query.pageSize,
                query.keyword || undefined,
            );
            return {
                items: result.list,
                total: result.total,
                query,
            };
        },
        onCommit: ({ items, total, query }) => {
            setFileList(items);
            setPagination({
                current: query.page,
                pageSize: query.pageSize,
                total,
            });
        },
        onLoadingChange: setLoading,
        onError: (error) => {
            console.error('获取文件列表失败:', error);
            if (!isAdminRequestError(error)) {
                message.error('文件列表加载失败');
            }
        },
    }));

    const ACCEPTED_FILE_TYPES = TEXT_FILE_ACCEPT_EXTENSIONS.join(',');

    /** 自定义上传处理 */
    const uploadProps: UploadProps = {
        accept: ACCEPTED_FILE_TYPES,
        capture: undefined,
        showUploadList: false,
        beforeUpload: async (file) => {
            try {
                await uploadFileWithState(file, uploadFile, setUploading);
                message.success(`${file.name} 上传成功`);
                // 保留操作完成时的最新搜索条件，并回到第一页查看上传结果。
                void fileListController.refresh((query) => ({ ...query, page: 1 }));
            } catch (error) {
                if (!isAdminRequestError(error)) {
                    message.error('文件上传失败');
                }
                console.error('上传文件失败:', error);
            }
            // 阻止上传组件自动发送同一文件。
            return false;
        },
    };

    useEffect(() => {
        void fileListController.mount();
        return () => {
            fileListController.dispose();
            previewRequestIdRef.current += 1;
        };
    }, [fileListController]);

    const handleSearch = (value: string) => {
        void fileListController.search(value);
    };

    const handleRefresh = () => {
        void fileListController.refresh();
    };

    const handleTableChange = (paginationConfig: { current?: number; pageSize?: number }) => {
        void fileListController.changePage(
            paginationConfig.current ?? 1,
            paginationConfig.pageSize ?? fileListController.getLatestQuery().pageSize,
        );
    };

    const handlePreview = async (record: FileItem) => {
        const requestId = ++previewRequestIdRef.current;
        setPreviewFileName(record.fileName);
        setPreviewContent('');
        setPreviewVisible(true);
        setPreviewLoading(true);
        try {
            const content = await getFileContent(record.id);
            // 只允许当前预览请求回写内容，避免连续点击不同文件时内容串台。
            if (requestId !== previewRequestIdRef.current) {
                return;
            }
            setPreviewContent(content);
        } catch (error) {
            if (requestId !== previewRequestIdRef.current) {
                return;
            }
            setPreviewContent(isAdminRequestError(error)
                ? getErrorMessage(error, '文件内容加载失败')
                : '文件内容加载失败');
            console.error('预览文件失败:', error);
        } finally {
            if (requestId === previewRequestIdRef.current) {
                setPreviewLoading(false);
            }
        }
    };

    const handleClosePreview = () => {
        previewRequestIdRef.current += 1;
        setPreviewVisible(false);
        setPreviewLoading(false);
    };

    const handleDownload = async (record: FileItem) => {
        try {
            const blob = await downloadFile(record.id);
            triggerBlobDownload(blob, record.fileName);
            message.success(`${record.fileName} 下载已开始`);
        } catch (error) {
            if (!isAdminRequestError(error)) {
                message.error('文件下载失败');
            }
            console.error('下载文件失败:', error);
        }
    };

    const handleDelete = async (record: FileItem) => {
        try {
            await deleteFile(record.id);
            message.success(`${record.fileName} 已删除`);
            // 刷新后根据最新总数自动校正越界页码。
            void fileListController.refresh();
        } catch (error) {
            if (!isAdminRequestError(error)) {
                message.error('文件删除失败');
            }
            console.error('删除文件失败:', error);
        }
    };

    const columns: ColumnsType<FileItem> = [
        {
            title: '文件名',
            dataIndex: 'fileName',
            key: 'fileName',
            ellipsis: true,
            render: (fileName: string) => (
                <Tooltip title={fileName}>
                    <span>
                        <FileOutlined style={{ marginRight: 8, color: '#5B6EF5' }} />
                        {fileName}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: '文件大小',
            dataIndex: 'fileSize',
            key: 'fileSize',
            width: 120,
            align: 'right',
            render: (size: number) => formatFileSize(size),
            sorter: (a, b) => a.fileSize - b.fileSize,
        },
        {
            title: '文件类型',
            dataIndex: 'fileType',
            key: 'fileType',
            width: 150,
            render: (type: string) => {
                const shortType = type.split('/').pop() || type;
                return <Tag color={getFileTypeColor(type)}>{shortType.toUpperCase()}</Tag>;
            },
        },
        {
            title: '上传时间',
            dataIndex: 'uploadTime',
            key: 'uploadTime',
            width: 180,
            sorter: (a, b) => new Date(a.uploadTime).getTime() - new Date(b.uploadTime).getTime(),
        },
        {
            title: '上传者',
            dataIndex: 'uploader',
            key: 'uploader',
            width: 100,
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(record)}
                    >
                        预览
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(record)}
                    >
                        下载
                    </Button>
                    <Popconfirm
                        title="确认删除"
                        description={`确定要删除文件「${record.fileName}」吗？`}
                        onConfirm={() => handleDelete(record)}
                        okText="确认"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileOutlined style={{ color: '#5B6EF5' }} />
                    文件管理
                </Title>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <Search
                    placeholder="搜索文件名..."
                    allowClear
                    onSearch={handleSearch}
                    style={{ maxWidth: 320 }}
                    prefix={<SearchOutlined style={{ color: '#9CA3BE' }} />}
                />
                <Space>
                    <Upload {...uploadProps}>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            loading={uploading}
                        >
                            上传文件
                        </Button>
                    </Upload>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                    >
                        刷新
                    </Button>
                </Space>
            </div>

            <div
                style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 4,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
            >
                <Table
                    columns={columns}
                    dataSource={fileList}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 个文件`,
                        pageSizeOptions: ['10', '20', '50'],
                    }}
                    onChange={handleTableChange}
                    size="middle"
                    bordered={false}
                />
            </div>

            <Modal
                title={
                    <span>
                        <EyeOutlined style={{ marginRight: 8 }} />
                        预览: {previewFileName}
                    </span>
                }
                open={previewVisible}
                onCancel={handleClosePreview}
                footer={[
                    <Button key="close" onClick={handleClosePreview}>
                        关闭
                    </Button>,
                ]}
                width={720}
                styles={{ body: { maxHeight: '60vh', overflow: 'auto' } }}
            >
                {previewLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
                ) : (
                    <pre
                        style={{
                            background: '#F7F8FC',
                            border: '1px solid #E8EAF2',
                            padding: 16,
                            borderRadius: 10,
                            fontSize: 13,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            margin: 0,
                            maxHeight: '55vh',
                            overflow: 'auto',
                            fontFamily: "'SF Mono', 'Menlo', 'Monaco', monospace",
                        }}
                    >
                        {previewContent}
                    </pre>
                )}
            </Modal>
        </div>
    );
};

export default FileManagement;
