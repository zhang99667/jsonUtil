import React, { useState, useEffect } from 'react';
import {
    DesktopOutlined,
    FileOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
    LogoutOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, theme, Button } from 'antd';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import { logout } from './services/auth';
import TrafficStats from './pages/TrafficStats';

const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

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

const items: MenuItem[] = [
    getItem('仪表盘与统计', '1', <PieChartOutlined />),
    getItem('流量统计', '3', <BarChartOutlined />),
    getItem('用户管理', '2', <TeamOutlined />),
    getItem('文件管理', '9', <FileOutlined />),
];

const App: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedKey, setSelectedKey] = useState('1');

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        logout();
        setIsAuthenticated(false);
    }

    const renderContent = () => {
        switch (selectedKey) {
            case '1':
                return <Dashboard />;
            case '2':
                return <UserManagement />;
            case '3':
                return <TrafficStats />;
            default:
                return <div>请选择功能菜单。</div>;
        }
    };

    const getBreadcrumbTitle = () => {
        switch (selectedKey) {
            case '1': return '仪表盘与统计';
            case '2': return '用户管理';
            case '3': return '流量统计';
            default: return '管理后台';
        }
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div style={{ 
                    height: 48, 
                    margin: 16, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10,
                    overflow: 'hidden'
                }}>
                    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#007acc' }}/>
                                <stop offset="100%" style={{ stopColor: '#00d4ff' }}/>
                            </linearGradient>
                            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#007acc' }}/>
                                <stop offset="100%" style={{ stopColor: '#0062a3' }}/>
                            </linearGradient>
                        </defs>
                        <path d="M24 8C18 8 14 12 14 18V26C14 29 12 32 8 32C12 32 14 35 14 38V46C14 52 18 56 24 56" 
                              stroke="url(#grad1)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <path d="M40 8C46 8 50 12 50 18V26C50 29 52 32 56 32C52 32 50 35 50 38V46C50 52 46 56 40 56" 
                              stroke="url(#grad2)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <circle cx="32" cy="24" r="3.5" fill="url(#grad1)"/>
                        <circle cx="32" cy="40" r="3.5" fill="url(#grad2)"/>
                    </svg>
                    {!collapsed && (
                        <span style={{ 
                            color: 'white', 
                            fontSize: 16, 
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                        }}>
                            JSON Utils
                        </span>
                    )}
                </div>
                <Menu
                    theme="dark"
                    defaultSelectedKeys={['1']}
                    mode="inline"
                    items={items}
                    onSelect={({ key }) => setSelectedKey(key)}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>退出登录</Button>
                </Header>
                <Content style={{ margin: '0 16px' }}>
                    <Breadcrumb style={{ margin: '16px 0' }}>
                        <Breadcrumb.Item>管理后台</Breadcrumb.Item>
                        <Breadcrumb.Item>{getBreadcrumbTitle()}</Breadcrumb.Item>
                    </Breadcrumb>
                    <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        {renderContent()}
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    JSON 助手管理系统 ©{new Date().getFullYear()} 由 Ant Design 构建
                </Footer>
            </Layout>
        </Layout>
    );
};

export default App;
