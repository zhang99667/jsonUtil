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
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
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
