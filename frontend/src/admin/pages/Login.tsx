import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../services/auth';
import { LoginFormValues } from '../../types';

interface LoginProps {
    onLogin: () => void;
}

/** 登录接口响应数据 */
interface LoginResponse {
    token?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const onFinish = async (values: LoginFormValues) => {
        try {
            const res = await login(values) as LoginResponse;
            if (res.token) {
                localStorage.setItem('token', res.token);
                message.success('登录成功');
                onLogin();
            }
        } catch (error) {
            // Error handled by interceptor
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <Card title="JSON 助手管理系统登录" style={{ width: 350 }}>
                <Form
                    name="login_form"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名！' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码！' }]}
                    >
                        <Input
                            prefix={<LockOutlined />}
                            type="password"
                            placeholder="密码"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                            登录
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
