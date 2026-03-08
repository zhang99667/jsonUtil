import React, { useState, useEffect } from 'react';
import {
    FileOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
    LogoutOutlined,
    BarChartOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, Avatar, Dropdown } from 'antd';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import { logout } from './services/auth';
import TrafficStats from './pages/TrafficStats';
import FileManagement from './pages/FileManagement';
import ErrorBoundary from '../components/ErrorBoundary';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

/** 构造菜单项的辅助函数 */
function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

/** 侧边栏菜单配置 */
const menuItems: MenuItem[] = [
    getItem('仪表盘', '1', <PieChartOutlined />),
    getItem('流量统计', '3', <BarChartOutlined />),
    getItem('用户管理', '2', <TeamOutlined />),
    getItem('文件管理', '9', <FileOutlined />),
];

/** 侧边栏展开宽度 */
const SIDER_WIDTH = 240;
/** 侧边栏收起宽度 */
const SIDER_COLLAPSED_WIDTH = 72;

const App: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedKey, setSelectedKey] = useState('1');

    useEffect(() => {
        // 检查本地存储中的认证令牌
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    /** 登录成功回调 */
    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    /** 退出登录处理 */
    const handleLogout = () => {
        logout();
        setIsAuthenticated(false);
    };

    /** 根据选中菜单渲染对应页面组件 */
    const renderContent = () => {
        switch (selectedKey) {
            case '1':
                return <Dashboard />;
            case '2':
                return <UserManagement />;
            case '3':
                return <TrafficStats />;
            case '9':
                return <FileManagement />;
            default:
                return <div>请选择功能菜单。</div>;
        }
    };

    /** 获取面包屑标题 */
    const getBreadcrumbTitle = () => {
        switch (selectedKey) {
            case '1': return '仪表盘';
            case '2': return '用户管理';
            case '3': return '流量统计';
            case '9': return '文件管理';
            default: return '管理后台';
        }
    };

    // 未认证时显示登录页面
    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    /** 用户头像下拉菜单选项 */
    const userDropdownItems: MenuProps['items'] = [
        {
            key: 'username',
            label: '管理员',
            icon: <UserOutlined />,
            disabled: true,
            style: { cursor: 'default', opacity: 0.85 },
        },
        { type: 'divider' },
        {
            key: 'logout',
            label: '退出登录',
            icon: <LogoutOutlined />,
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <ErrorBoundary>
            <Layout style={{ minHeight: '100vh' }}>
                {/* 侧边栏 */}
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    width={SIDER_WIDTH}
                    collapsedWidth={SIDER_COLLAPSED_WIDTH}
                    trigger={null}
                    style={{
                        background: 'linear-gradient(180deg, #1E2235 0%, #262B44 100%)',
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Logo 区域 */}
                    <div
                        style={{
                            height: 64,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '0' : '0 20px',
                            gap: 10,
                            overflow: 'hidden',
                            flexShrink: 0,
                        }}
                    >
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 64 64"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ flexShrink: 0 }}
                        >
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#007acc' }} />
                                    <stop offset="100%" style={{ stopColor: '#00d4ff' }} />
                                </linearGradient>
                                <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#007acc' }} />
                                    <stop offset="100%" style={{ stopColor: '#0062a3' }} />
                                </linearGradient>
                            </defs>
                            <path
                                d="M24 8C18 8 14 12 14 18V26C14 29 12 32 8 32C12 32 14 35 14 38V46C14 52 18 56 24 56"
                                stroke="url(#grad1)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <path
                                d="M40 8C46 8 50 12 50 18V26C50 29 52 32 56 32C52 32 50 35 50 38V46C50 52 46 56 40 56"
                                stroke="url(#grad2)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <circle cx="32" cy="24" r="3.5" fill="url(#grad1)" />
                            <circle cx="32" cy="40" r="3.5" fill="url(#grad2)" />
                        </svg>
                        {!collapsed && (
                            <span
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                JSON Utils
                            </span>
                        )}
                    </div>

                    {/* 菜单区域 */}
                    <Menu
                        theme="dark"
                        selectedKeys={[selectedKey]}
                        mode="inline"
                        items={menuItems}
                        onSelect={({ key }) => setSelectedKey(key)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            flex: 1,
                            paddingTop: 8,
                        }}
                    />

                    {/* 底部折叠按钮 */}
                    <div
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '0' : '0 24px',
                            cursor: 'pointer',
                            color: 'rgba(255, 255, 255, 0.55)',
                            fontSize: 16,
                            gap: 10,
                            flexShrink: 0,
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)';
                        }}
                    >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        {!collapsed && (
                            <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>收起菜单</span>
                        )}
                    </div>
                </Sider>

                {/* 右侧主体区域 */}
                <Layout
                    style={{
                        marginLeft: collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
                        transition: 'margin-left 0.2s',
                        background: '#F7F8FC',
                    }}
                >
                    {/* 顶栏 - 毛玻璃效果 */}
                    <Header
                        style={{
                            height: 64,
                            padding: '0 24px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'sticky',
                            top: 0,
                            zIndex: 9,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                            lineHeight: 'normal',
                        }}
                    >
                        {/* 左侧面包屑 */}
                        <Breadcrumb
                            items={[
                                { title: '管理后台' },
                                { title: getBreadcrumbTitle() },
                            ]}
                        />

                        {/* 右侧用户头像下拉菜单 */}
                        <Dropdown
                            menu={{ items: userDropdownItems }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: 8,
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <Avatar
                                    size={32}
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: '#5B6ABF' }}
                                />
                                <span style={{ fontSize: 14, color: '#333' }}>管理员</span>
                            </div>
                        </Dropdown>
                    </Header>

                    {/* 内容区域 - 直接渲染页面组件，带淡入动画 */}
                    <Content style={{ padding: 24, minHeight: 360 }}>
                        <div
                            key={selectedKey}
                            style={{
                                animation: 'adminFadeIn 0.3s ease-in-out',
                            }}
                        >
                            {renderContent()}
                        </div>
                        {/* 淡入动画关键帧定义 */}
                        <style>{`
                            @keyframes adminFadeIn {
                                from {
                                    opacity: 0;
                                    transform: translateY(8px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                            /* 覆盖 Ant Design 侧边栏菜单默认样式 */
                            .ant-layout-sider .ant-menu-item {
                                border-radius: 8px !important;
                                margin: 4px 12px !important;
                                width: calc(100% - 24px) !important;
                            }
                            .ant-layout-sider .ant-menu-item.ant-menu-item-selected {
                                background: rgba(255, 255, 255, 0.12) !important;
                            }
                        `}</style>
                    </Content>

                    {/* 底部 Footer */}
                    <Footer
                        style={{
                            textAlign: 'center',
                            color: '#9CA3BE',
                            background: 'transparent',
                            padding: '16px 24px',
                        }}
                    >
                        JSON 助手管理系统 ©2026
                    </Footer>
                </Layout>
            </Layout>
        </ErrorBoundary>
    );
};

export default App;
