import React from 'react';
import { Form, Input, Button, message } from 'antd';
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

/** 入场动画关键帧，组件挂载时注入到 head */
const KEYFRAMES_STYLE_ID = 'login-slide-up-keyframes';
const ensureKeyframes = () => {
    if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = KEYFRAMES_STYLE_ID;
    style.textContent = `
        @keyframes loginSlideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    /* 确保入场动画关键帧已注入 */
    React.useEffect(() => {
        ensureKeyframes();
    }, []);

    /** 提交登录表单 */
    const onFinish = async (values: LoginFormValues) => {
        try {
            const res = await login(values) as LoginResponse;
            if (res.token) {
                localStorage.setItem('token', res.token);
                message.success('登录成功');
                onLogin();
            }
        } catch (error) {
            // 错误由拦截器统一处理
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            {/* 登录卡片 */}
            <div
                style={{
                    width: 420,
                    maxWidth: '90vw',
                    background: '#fff',
                    borderRadius: 20,
                    padding: 40,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    animation: 'loginSlideUp 0.6s ease-out',
                }}
            >
                {/* 品牌区域 */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginBottom: 32,
                    }}
                >
                    {/* Logo SVG — JSON 大括号 */}
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect width="48" height="48" rx="12" fill="url(#logoGrad)" />
                        <text
                            x="24"
                            y="32"
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="26"
                            fontWeight="bold"
                            fontFamily="monospace"
                        >
                            {'{ }'}
                        </text>
                        <defs>
                            <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                                <stop stopColor="#5B6EF5" />
                                <stop offset="1" stopColor="#7C5BF5" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div
                        style={{
                            marginTop: 12,
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#1A1D2E',
                            lineHeight: 1.3,
                        }}
                    >
                        JSON Utils
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: '#5A607F',
                            marginTop: 4,
                        }}
                    >
                        管理后台
                    </div>
                </div>

                {/* 登录表单 */}
                <Form name="login_form" onFinish={onFinish}>
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名！' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#9CA3BE' }} />}
                            placeholder="用户名"
                            style={{
                                height: 46,
                                borderRadius: 10,
                                fontSize: 15,
                            }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码！' }]}
                    >
                        <Input
                            prefix={<LockOutlined style={{ color: '#9CA3BE' }} />}
                            type="password"
                            placeholder="密码"
                            style={{
                                height: 46,
                                borderRadius: 10,
                                fontSize: 15,
                            }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{
                                width: '100%',
                                height: 46,
                                borderRadius: 10,
                                fontSize: 16,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #5B6EF5, #7C5BF5)',
                                border: 'none',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                            }}
                        >
                            登录
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Login;
