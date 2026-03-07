import React, { useState, useEffect, useCallback } from 'react';
import {
    Form, Input, Button, Select, message, Card, Row, Col, Typography,
    Table, Modal, Popconfirm, Switch, Tag, Space
} from 'antd';
import {
    TeamOutlined, UserAddOutlined, MailOutlined, LockOutlined,
    IdcardOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
    ReloadOutlined, UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
    addUser, getUserList, updateUser, deleteUser, toggleUserEnabled,
    UserRecord, AddUserParams, UpdateUserParams
} from '../services/user';

const { Option } = Select;
const { Title } = Typography;

/** 默认每页条数 */
const DEFAULT_PAGE_SIZE = 10;

const UserManagement: React.FC = () => {
    // ==================== 状态定义 ====================

    /** 添加用户表单 */
    const [addForm] = Form.useForm();
    /** 编辑用户表单 */
    const [editForm] = Form.useForm();

    /** 用户列表数据 */
    const [userList, setUserList] = useState<UserRecord[]>([]);
    /** 列表加载状态 */
    const [loading, setLoading] = useState(false);
    /** 分页信息 */
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
    });
    /** 搜索关键词 */
    const [searchKeyword, setSearchKeyword] = useState('');
    /** 编辑弹窗是否可见 */
    const [editModalVisible, setEditModalVisible] = useState(false);
    /** 当前编辑的用户 */
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    /** 编辑提交中 */
    const [editLoading, setEditLoading] = useState(false);
    /** 添加用户折叠状态 */
    const [showAddForm, setShowAddForm] = useState(false);

    // ==================== 数据获取 ====================

    /**
     * 获取用户列表
     */
    const fetchUserList = useCallback(async (page = 1, size = DEFAULT_PAGE_SIZE, keyword = searchKeyword) => {
        setLoading(true);
        try {
            // 后端分页从 0 开始，前端从 1 开始
            const result = await getUserList(page - 1, size, keyword || undefined);
            setUserList(result.content);
            setPagination({
                current: result.number + 1,
                pageSize: result.size,
                total: result.totalElements,
            });
        } catch {
            // 错误已由 request 拦截器统一处理
        } finally {
            setLoading(false);
        }
    }, [searchKeyword]);

    /** 组件挂载时加载数据 */
    useEffect(() => {
        fetchUserList();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ==================== 事件处理 ====================

    /**
     * 添加用户提交
     */
    const handleAddUser = async (values: AddUserParams) => {
        try {
            await addUser(values);
            message.success('用户添加成功');
            addForm.resetFields();
            setShowAddForm(false);
            // 刷新列表
            fetchUserList(1);
        } catch {
            // 错误已由拦截器处理
        }
    };

    /**
     * 搜索用户
     */
    const handleSearch = (value: string) => {
        setSearchKeyword(value);
        fetchUserList(1, pagination.pageSize, value);
    };

    /**
     * 表格分页变化
     */
    const handleTableChange = (page: number, pageSize: number) => {
        fetchUserList(page, pageSize);
    };

    /**
     * 打开编辑弹窗
     */
    const handleEdit = (record: UserRecord) => {
        setEditingUser(record);
        editForm.setFieldsValue({
            username: record.username,
            email: record.email || '',
            role: record.role,
            password: '', // 密码字段默认为空，不回显
        });
        setEditModalVisible(true);
    };

    /**
     * 编辑提交
     */
    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            if (!editingUser) return;

            setEditLoading(true);
            const params: UpdateUserParams = {
                username: values.username,
                email: values.email || undefined,
                role: values.role,
            };
            // 仅当输入了密码才传递
            if (values.password && values.password.trim()) {
                params.password = values.password;
            }
            await updateUser(editingUser.id, params);
            message.success('用户信息更新成功');
            setEditModalVisible(false);
            setEditingUser(null);
            editForm.resetFields();
            // 刷新当前页
            fetchUserList(pagination.current, pagination.pageSize);
        } catch {
            // 表单验证失败或接口错误
        } finally {
            setEditLoading(false);
        }
    };

    /**
     * 删除用户
     */
    const handleDelete = async (id: number) => {
        try {
            await deleteUser(id);
            message.success('用户已删除');
            // 如果删除后当前页为空，回退到上一页
            const newTotal = pagination.total - 1;
            const maxPage = Math.max(1, Math.ceil(newTotal / pagination.pageSize));
            const targetPage = Math.min(pagination.current, maxPage);
            fetchUserList(targetPage, pagination.pageSize);
        } catch {
            // 错误已由拦截器处理
        }
    };

    /**
     * 切换用户启用/禁用状态
     */
    const handleToggleEnabled = async (record: UserRecord) => {
        try {
            await toggleUserEnabled(record.id);
            message.success(record.enabled ? '用户已禁用' : '用户已启用');
            // 刷新当前页
            fetchUserList(pagination.current, pagination.pageSize);
        } catch {
            // 错误已由拦截器处理
        }
    };

    // ==================== 表格列配置 ====================

    const columns: ColumnsType<UserRecord> = [
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            width: 160,
            render: (text: string) => (
                <span>
                    <UserOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                    {text}
                </span>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            render: (text: string | null) => text || <span style={{ color: '#bfbfbf' }}>未设置</span>,
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            align: 'center',
            render: (role: string) => {
                const isAdmin = role === 'ADMIN';
                return (
                    <Tag color={isAdmin ? 'red' : 'blue'}>
                        {isAdmin ? '管理员' : '普通用户'}
                    </Tag>
                );
            },
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 100,
            align: 'center',
            render: (enabled: boolean, record: UserRecord) => (
                <Switch
                    checked={enabled}
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                    onChange={() => handleToggleEnabled(record)}
                />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (text: string) => {
                if (!text) return '-';
                // 后端返回 LocalDateTime 格式，例如 "2025-01-15T10:30:00"
                const date = new Date(text);
                return date.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_: unknown, record: UserRecord) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确认删除"
                        description={`确定要删除用户「${record.username}」吗？此操作不可撤销。`}
                        onConfirm={() => handleDelete(record.id)}
                        okText="确认删除"
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

    // ==================== 渲染 ====================

    return (
        <div>
            {/* 页面标题 */}
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamOutlined />
                    用户管理
                </Title>
            </div>

            {/* 搜索栏和操作按钮 */}
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Input.Search
                            placeholder="搜索用户名"
                            allowClear
                            enterButton={<><SearchOutlined /> 搜索</>}
                            onSearch={handleSearch}
                            onChange={(e) => {
                                // 清空输入框时自动重新加载
                                if (!e.target.value) {
                                    handleSearch('');
                                }
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={16} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => fetchUserList(pagination.current, pagination.pageSize)}
                        >
                            刷新
                        </Button>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            {showAddForm ? '收起' : '添加用户'}
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* 添加用户表单（可折叠） */}
            {showAddForm && (
                <Card
                    title={<><UserAddOutlined style={{ marginRight: 8 }} />添加新用户</>}
                    bordered={false}
                    style={{ marginBottom: 16 }}
                >
                    <Form
                        form={addForm}
                        layout="inline"
                        onFinish={handleAddUser}
                        initialValues={{ role: 'USER' }}
                        style={{ flexWrap: 'wrap', gap: '8px 0' }}
                    >
                        <Form.Item
                            name="username"
                            rules={[{ required: true, message: '请输入用户名' }]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="用户名"
                                style={{ width: 180 }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="密码"
                                style={{ width: 180 }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="role"
                            rules={[{ required: true, message: '请选择角色' }]}
                        >
                            <Select suffixIcon={<IdcardOutlined />} style={{ width: 130 }}>
                                <Option value="USER">普通用户</Option>
                                <Option value="ADMIN">管理员</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
                                添加
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )}

            {/* 用户列表表格 */}
            <Card bordered={false}>
                <Table<UserRecord>
                    columns={columns}
                    dataSource={userList}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total) => `共 ${total} 条记录`,
                        onChange: handleTableChange,
                        onShowSizeChange: handleTableChange,
                    }}
                    scroll={{ x: 900 }}
                    size="middle"
                />
            </Card>

            {/* 编辑用户弹窗 */}
            <Modal
                title="编辑用户"
                open={editModalVisible}
                onOk={handleEditSubmit}
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingUser(null);
                    editForm.resetFields();
                }}
                confirmLoading={editLoading}
                okText="保存"
                cancelText="取消"
                destroyOnClose
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="username"
                        label="用户名"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="请输入用户名"
                        />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="电子邮件"
                        rules={[
                            { type: 'email', message: '请输入有效的电子邮件' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="请输入邮箱地址（选填）"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="新密码"
                        extra="留空则不修改密码"
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="输入新密码（留空不修改）"
                        />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="角色"
                        rules={[{ required: true, message: '请选择角色' }]}
                    >
                        <Select suffixIcon={<IdcardOutlined />}>
                            <Option value="USER">普通用户</Option>
                            <Option value="ADMIN">管理员</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
