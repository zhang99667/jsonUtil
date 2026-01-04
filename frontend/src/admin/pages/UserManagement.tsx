import React from 'react';
import { Form, Input, Button, Select, message, Card } from 'antd';
import { addUser } from '../services/user';

const { Option } = Select;

const UserManagement: React.FC = () => {
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        try {
            await addUser(values);
            message.success('User added successfully');
            form.resetFields();
        } catch (error) {
            // Error handled by interceptor
        }
    };

    return (
        <Card title="Add New User">
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ role: 'USER' }}
            >
                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Please input email!' },
                        { type: 'email', message: 'Please enter a valid email!' }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: 'Please input password!' }]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    name="role"
                    label="Role"
                    rules={[{ required: true, message: 'Please select a role!' }]}
                >
                    <Select>
                        <Option value="USER">User</Option>
                        <Option value="ADMIN">Admin</Option>
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Add User
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default UserManagement;
