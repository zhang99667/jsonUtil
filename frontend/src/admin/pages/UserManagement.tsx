import React, { useState, useEffect, useRef } from 'react';
import {
    Form, Input, Button, Select, message, Card as AntCard, Typography,
    Table, Modal, Popconfirm, Switch, Tag, Space
} from 'antd';
import {
    TeamOutlined, UserAddOutlined, MailOutlined, LockOutlined,
    IdcardOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
    ReloadOutlined, UserOutlined
} from '@ant-design/icons';
import type { CardProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    addUser, getUserList, updateUser, deleteUser,
} from '../services/user';
import type {
    AddUserParams,
    UserRecord,
    UserRole,
} from '../services/user';
import { createAdminListRequestController } from '../utils/listRequestController';
import {
    buildUpdateUserParams,
    formatUserCreatedAt,
} from './UserManagementModel';
import type { EditUserFormValues } from './UserManagementModel';
import {
    handleUserManagementRequestError,
    isUserFormValidationError,
} from './UserManagementErrors';

const Card = AntCard as React.ComponentType<React.PropsWithChildren<CardProps>>;
const { Title } = Typography;

const ROLE_OPTIONS = [
    { value: 'USER', label: '普通用户' },
    { value: 'ADMIN', label: '管理员' },
] satisfies ReadonlyArray<{ value: UserRole; label: string }>;

const DEFAULT_PAGE_SIZE = 10;

const UserManagement: React.FC = () => {
    const [addForm] = Form.useForm<AddUserParams>();
    const [editForm] = Form.useForm<EditUserFormValues>();
    const [userList, setUserList] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
    });
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const pendingEnabledUserIdsRef = useRef(new Set<number>());
    const [pendingEnabledUserIds, setPendingEnabledUserIds] = useState<ReadonlySet<number>>(() => new Set());
    const [userListController] = useState(() => createAdminListRequestController({
        initialQuery: {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            keyword: '',
        },
        loadPage: async (query) => {
            // 用户接口页码从零开始，控制器统一使用从一开始的页码。
            const result = await getUserList(
                query.page - 1,
                query.pageSize,
                query.keyword || undefined,
            );
            return {
                items: result.content,
                total: result.totalElements,
                query: {
                    ...query,
                    page: result.number + 1,
                    pageSize: result.size,
                },
            };
        },
        onCommit: ({ items, total, query }) => {
            setUserList(items);
            setPagination({
                current: query.page,
                pageSize: query.pageSize,
                total,
            });
        },
        onLoadingChange: setLoading,
        onError: (error) => {
            handleUserManagementRequestError(error, '用户列表加载失败', '获取用户列表');
        },
    }));

    useEffect(() => {
        void userListController.mount();
        return () => userListController.dispose();
    }, [userListController]);

    const handleAddUser = async (values: AddUserParams) => {
        try {
            await addUser(values);
            message.success('用户添加成功');
            addForm.resetFields();
            setShowAddForm(false);
            // 新用户可能改变排序首项，保留最新搜索条件并回到第一页。
            void userListController.refresh((query) => ({ ...query, page: 1 }));
        } catch (error) {
            handleUserManagementRequestError(error, '用户添加失败', '添加用户');
        }
    };

    const handleSearch = (value: string) => {
        void userListController.search(value);
    };

    const handleTableChange = (page: number, pageSize: number) => {
        void userListController.changePage(page, pageSize);
    };

    const handleEdit = (record: UserRecord) => {
        setEditingUser(record);
        editForm.setFieldsValue({
            username: record.username,
            email: record.email || '',
            role: record.role,
            // 密码不回显，留空时更新请求也不会提交该字段。
            password: '',
        });
        setEditModalVisible(true);
    };

    const handleEditSubmit = async () => {
        let values: EditUserFormValues;
        try {
            values = await editForm.validateFields();
        } catch (error) {
            if (!isUserFormValidationError(error)) {
                handleUserManagementRequestError(error, '用户信息校验失败', '校验用户信息');
            }
            return;
        }
        if (!editingUser) return;

        setEditLoading(true);
        try {
            await updateUser(editingUser.id, buildUpdateUserParams(values));
            message.success('用户信息更新成功');
            setEditModalVisible(false);
            setEditingUser(null);
            editForm.resetFields();
            void userListController.refresh();
        } catch (error) {
            handleUserManagementRequestError(error, '用户信息更新失败', '更新用户');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteUser(id);
            message.success('用户已删除');
            // 服务端最新总数会在列表请求中决定是否回退末页。
            void userListController.refresh();
        } catch (error) {
            handleUserManagementRequestError(error, '用户删除失败', '删除用户');
        }
    };

    const handleSetEnabled = async (id: number, enabled: boolean) => {
        if (pendingEnabledUserIdsRef.current.has(id)) return;

        pendingEnabledUserIdsRef.current.add(id);
        setPendingEnabledUserIds(new Set(pendingEnabledUserIdsRef.current));
        try {
            await updateUser(id, { enabled });
            message.success(enabled ? '用户已启用' : '用户已禁用');
            await userListController.refresh();
        } catch (error) {
            handleUserManagementRequestError(
                error,
                enabled ? '启用用户失败' : '禁用用户失败',
                '更新用户状态',
            );
        } finally {
            pendingEnabledUserIdsRef.current.delete(id);
            if (userListController.isMounted()) {
                setPendingEnabledUserIds(new Set(pendingEnabledUserIdsRef.current));
            }
        }
    };

    const columns: ColumnsType<UserRecord> = [
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            width: 160,
            render: (text: string) => (
                <span>
                    <UserOutlined style={{ marginRight: 6, color: '#5B6EF5' }} />
                    {text}
                </span>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            render: (text: string | null) => text || <span style={{ color: '#9CA3BE' }}>未设置</span>,
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            align: 'center',
            render: (role: UserRole) => {
                const isAdmin = role === 'ADMIN';
                return (
                    <Tag color={isAdmin ? 'purple' : 'blue'}>
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
                    loading={pendingEnabledUserIds.has(record.id)}
                    onChange={(nextEnabled) => void handleSetEnabled(record.id, nextEnabled)}
                />
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: formatUserCreatedAt,
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

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamOutlined style={{ color: '#5B6EF5' }} />
                    用户管理
                </Title>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <Input.Search
                    placeholder="搜索用户名"
                    allowClear
                    enterButton={<><SearchOutlined /> 搜索</>}
                    onSearch={handleSearch}
                    onChange={(e) => {
                        if (!e.target.value) {
                            handleSearch('');
                        }
                    }}
                    style={{ maxWidth: 320 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => { void userListController.refresh(); }}
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
                </div>
            </div>

            {showAddForm && (
                <Card
                    title={<><UserAddOutlined style={{ marginRight: 8 }} />添加新用户</>}
                    bordered={false}
                    style={{ marginBottom: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                    <Form<AddUserParams>
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
                                prefix={<UserOutlined style={{ color: '#9CA3BE' }} />}
                                placeholder="用户名"
                                style={{ width: 180 }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: '请输入密码' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#9CA3BE' }} />}
                                placeholder="密码"
                                style={{ width: 180 }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="role"
                            rules={[{ required: true, message: '请选择角色' }]}
                        >
                            <Select suffixIcon={<IdcardOutlined />} style={{ width: 130 }} options={ROLE_OPTIONS} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
                                添加
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )}

            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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
                <Form<EditUserFormValues>
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
                            prefix={<UserOutlined style={{ color: '#9CA3BE' }} />}
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
                            prefix={<MailOutlined style={{ color: '#9CA3BE' }} />}
                            placeholder="请输入邮箱地址（选填）"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="新密码"
                        extra="留空则不修改密码"
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#9CA3BE' }} />}
                            placeholder="输入新密码（留空不修改）"
                        />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="角色"
                        rules={[{ required: true, message: '请选择角色' }]}
                    >
                        <Select suffixIcon={<IdcardOutlined />} options={ROLE_OPTIONS} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
