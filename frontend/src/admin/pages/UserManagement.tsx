import React from 'react';
import { Form, Input, Button, Select, message, Card, Row, Col, Typography } from 'antd';
import { TeamOutlined, UserAddOutlined, MailOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { addUser } from '../services/user';

const { Option } = Select;
const { Title } = Typography;

const UserManagement: React.FC = () => {
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        try {
            await addUser(values);
            message.success('用户添加成功');
            form.resetFields();
        } catch (error) {
            // Error handled by interceptor
        }
    };

    return (
        <div>
            {/* 页面标题 */}
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamOutlined />
                    用户管理
                </Title>
            </div>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card 
                        title={<><UserAddOutlined style={{ marginRight: 8 }} />添加新用户</>}
                        bordered={false}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{ role: 'USER' }}
                        >
                            <Form.Item
                                name="email"
                                label="电子邮件"
                                rules={[
                                    { required: true, message: '请输入电子邮件！' },
                                    { type: 'email', message: '请输入有效的电子邮件！' }
                                ]}
                            >
                                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入邮箱地址" />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                label="密码"
                                rules={[{ required: true, message: '请输入密码！' }]}
                            >
                                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="请输入密码" />
                            </Form.Item>
                            <Form.Item
                                name="role"
                                label="角色"
                                rules={[{ required: true, message: '请选择角色！' }]}
                            >
                                <Select suffixIcon={<IdcardOutlined />}>
                                    <Option value="USER">普通用户</Option>
                                    <Option value="ADMIN">管理员</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
                                    添加用户
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UserManagement;
