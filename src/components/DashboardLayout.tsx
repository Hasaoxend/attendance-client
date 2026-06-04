import { type ReactNode, useState } from 'react';
import { Layout, Menu, Button, Typography, Space, Drawer, Grid } from 'antd';
import { 
    LogoutOutlined, 
    SafetyCertificateOutlined, 
    MenuFoldOutlined, 
    MenuUnfoldOutlined,
    MenuOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface DashboardLayoutProps {
    children: ReactNode;
    title: string;
    menuItems: Array<{
        key: string;
        label: string;
        icon?: ReactNode;
        path?: string;
        onClick?: () => void;
    }>;
    contentStyle?: React.CSSProperties;
    contentClassName?: string;
}

const DashboardLayout = ({ children, title, menuItems, contentStyle, contentClassName }: DashboardLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const isMobile = screens.md === false;
    
    const { logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sideMenu = (
        <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ borderRight: 0 }}
            items={menuItems.map((item: any) => ({
                ...item,
                onClick: () => {
                    if (item.onClick) item.onClick();
                    if (item.path) navigate(item.path);
                    if (isMobile) setDrawerVisible(false);
                }
            }))}
        />
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {!isMobile && (
                <Sider 
                    trigger={null} 
                    collapsible 
                    collapsed={collapsed}
                    width={260}
                    theme="dark"
                    style={{ 
                        boxShadow: '4px 0 10px rgba(0,0,0,0.1)', 
                        zIndex: 10,
                        background: '#001529' 
                    }}
                >
                    <div style={{ 
                        height: 64, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        background: '#002140',
                        margin: '0 0 16px 0'
                    }}>
                        <Space>
                            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            {!collapsed && <Title level={4} style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600 }}>ATTENDANCE</Title>}
                        </Space>
                    </div>
                    {sideMenu}
                </Sider>
            )}

            <Drawer
                title={
                    <Space>
                        <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                        <Text strong style={{ fontSize: '16px' }}>ATTENDANCE</Text>
                    </Space>
                }
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ body: { padding: 0, background: '#001529' }, header: { background: '#002140', color: '#fff' } }}
                width={280}
                closable={false}
            >
                <div style={{ padding: '0 0 16px 0' }}>
                    {sideMenu}
                </div>
            </Drawer>

            <Layout>
                <Header style={{ 
                    background: '#fff', 
                    padding: isMobile ? '0 16px' : '0 24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
                    zIndex: 100,
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: isMobile ? '100%' : `calc(100% - ${collapsed ? 80 : 260}px)`,
                    transition: 'width 0.2s'
                }}>
                    <Button
                        type="text"
                        icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
                        onClick={() => isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)}
                        style={{ fontSize: '16px', width: 48, height: 64 }}
                    />
                    <Title level={4} style={{ margin: 0, flex: 1, marginLeft: isMobile ? 8 : 16, fontSize: isMobile ? '16px' : '20px' }}>
                        {title}
                    </Title>
                    <Space size={isMobile ? "small" : "large"}>
                        {!isMobile && <Typography.Text strong>{user.name}</Typography.Text>}
                        <Button 
                            type="primary" 
                            danger 
                            ghost 
                            icon={<LogoutOutlined />} 
                            onClick={handleLogout}
                            size={isMobile ? "small" : "middle"}
                        >
                            {isMobile ? '' : 'Đăng xuất'}
                        </Button>
                    </Space>
                </Header>
                <Content style={{ margin: isMobile ? '12px' : '24px', minHeight: 280, paddingTop: 64 }}>
                    <div className={contentClassName} style={{ 
                        background: '#fff', 
                        padding: isMobile ? 12 : 24, 
                        borderRadius: 12, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)', 
                        minHeight: '100%',
                        overflowX: 'auto',
                        ...contentStyle
                    }}>
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;
