import React from 'react';
import { Form, Input, Button, Select, message, Card } from 'antd';
import { addUser } from '../services/user';

const { Option } = Select;

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
        <Card title="添加新用户">
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
                    <Input />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码！' }]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    name="role"
                    label="角色"
                    rules={[{ required: true, message: '请选择角色！' }]}
                >
                    <Select>
                        <Option value="USER">User</Option>
                        <Option value="ADMIN">Admin</Option>
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        添加用户
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default UserManagement;
