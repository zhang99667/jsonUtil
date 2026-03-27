import React, { useState, useEffect, useCallback } from 'react';
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

const { Title } = Typography;
const { Search } = Input;

/**
 * 格式化文件大小（字节 -> 可读字符串）
 */
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
};

/**
 * 根据文件类型返回标签颜色
 */
const getFileTypeColor = (fileType: string): string => {
    if (fileType.includes('json')) return 'blue';
    if (fileType.includes('xml')) return 'orange';
    if (fileType.includes('text')) return 'green';
    if (fileType.includes('csv')) return 'purple';
    return 'default';
};

/**
 * 文件管理页面
 * 提供文件列表展示、搜索、预览、下载和删除功能
 */
const FileManagement: React.FC = () => {
    // 文件列表数据
    const [fileList, setFileList] = useState<FileItem[]>([]);
    // 加载状态
    const [loading, setLoading] = useState(false);
    // 分页信息
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    // 搜索关键词
    const [keyword, setKeyword] = useState('');
    // 预览弹窗是否显示
    const [previewVisible, setPreviewVisible] = useState(false);
    // 预览文件内容
    const [previewContent, setPreviewContent] = useState('');
    // 预览文件名
    const [previewFileName, setPreviewFileName] = useState('');
    // 预览内容加载状态
    const [previewLoading, setPreviewLoading] = useState(false);
    // 文件上传中状态
    const [uploading, setUploading] = useState(false);

    /** 允许上传的文件类型 */
    const ACCEPTED_FILE_TYPES = '.json,.xml,.csv,.txt,.yaml,.yml';

    /**
     * 自定义上传处理
     */
    const uploadProps: UploadProps = {
        accept: ACCEPTED_FILE_TYPES,
        showUploadList: false,
        beforeUpload: () => false, // 阻止自动上传，使用自定义逻辑
        onChange: async (info) => {
            const file = info.file as unknown as File;
            if (!file) return;

            setUploading(true);
            try {
                await uploadFile(file);
                message.success(`${file.name} 上传成功`);
                // 上传成功后刷新列表，回到第一页
                fetchFiles(1, pagination.pageSize, keyword);
            } catch (error) {
                message.error('文件上传失败');
                console.error('上传文件失败:', error);
            } finally {
                setUploading(false);
            }
        },
    };

    /**
     * 获取文件列表
     */
    const fetchFiles = useCallback(async (page: number, pageSize: number, search?: string) => {
        setLoading(true);
        try {
            const result = await getFileList(page, pageSize, search);
            setFileList(result.list);
            setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize,
                total: result.total,
            }));
        } catch (error) {
            console.error('获取文件列表失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 初次加载
    useEffect(() => {
        fetchFiles(1, pagination.pageSize);
    }, [fetchFiles, pagination.pageSize]);

    /**
     * 搜索文件
     */
    const handleSearch = (value: string) => {
        setKeyword(value);
        fetchFiles(1, pagination.pageSize, value);
    };

    /**
     * 刷新列表
     */
    const handleRefresh = () => {
        fetchFiles(pagination.current, pagination.pageSize, keyword);
    };

    /**
     * 表格翻页
     */
    const handleTableChange = (paginationConfig: { current?: number; pageSize?: number }) => {
        fetchFiles(paginationConfig.current ?? 1, paginationConfig.pageSize ?? pagination.pageSize, keyword);
    };

    /**
     * 预览文件内容
     */
    const handlePreview = async (record: FileItem) => {
        setPreviewFileName(record.fileName);
        setPreviewVisible(true);
        setPreviewLoading(true);
        try {
            const content = await getFileContent(record.id);
            setPreviewContent(content);
        } catch (error) {
            setPreviewContent('文件内容加载失败');
            console.error('预览文件失败:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    /**
     * 下载文件
     */
    const handleDownload = async (record: FileItem) => {
        try {
            await downloadFile(record.id, record.fileName);
            message.success(`${record.fileName} 下载成功`);
        } catch (error) {
            message.error('文件下载失败');
            console.error('下载文件失败:', error);
        }
    };

    /**
     * 删除文件
     */
    const handleDelete = async (record: FileItem) => {
        try {
            await deleteFile(record.id);
            message.success(`${record.fileName} 已删除`);
            // 删除后刷新列表，如果当前页没有数据则回退到上一页
            const newTotal = pagination.total - 1;
            const maxPage = Math.ceil(newTotal / pagination.pageSize) || 1;
            const targetPage = pagination.current > maxPage ? maxPage : pagination.current;
            fetchFiles(targetPage, pagination.pageSize, keyword);
        } catch (error) {
            message.error('文件删除失败');
            console.error('删除文件失败:', error);
        }
    };

    // 表格列定义
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
                // 提取简短类型名
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
            {/* 页面标题 */}
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileOutlined style={{ color: '#5B6EF5' }} />
                    文件管理
                </Title>
            </div>

            {/* 搜索栏和操作按钮 */}
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

            {/* 文件列表表格 — 白底圆角容器 */}
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

            {/* 文件预览弹窗 */}
            <Modal
                title={
                    <span>
                        <EyeOutlined style={{ marginRight: 8 }} />
                        预览: {previewFileName}
                    </span>
                }
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setPreviewVisible(false)}>
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
