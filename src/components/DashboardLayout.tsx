import { type ReactNode, useState } from 'react';
import { Layout, Menu, Button, Typography, Space, Drawer, Grid, Avatar, Divider, Modal, Form, Input, message, Upload, Spin } from 'antd';
import { 
    LogoutOutlined, 
    SafetyCertificateOutlined, 
    MenuFoldOutlined, 
    MenuUnfoldOutlined,
    MenuOutlined,
    CalendarOutlined,
    TeamOutlined,
    HistoryOutlined,
    BarChartOutlined,
    SettingOutlined,
    LockOutlined,
    CameraOutlined,
    DeleteOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface DashboardLayoutProps {
    children: ReactNode;
    title: string;
    menuItems?: Array<{
        key: string;
        label: string;
        icon?: ReactNode;
        path?: string;
        onClick?: () => void;
    }>;
    contentStyle?: React.CSSProperties;
    contentClassName?: string;
}

const DashboardLayout = ({ children, title, contentStyle, contentClassName }: DashboardLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const screens = useBreakpoint();
    const isMobile = screens.md === false;
    
    const { user, logout, updateUser } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [pwForm] = Form.useForm();
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUser = user || localUser;
    const role = currentUser.role;

    // Avatar: use custom if available, fallback to DiceBear
    const getAvatarSrc = () => {
        if (currentUser.avatarUrl) {
            // If it starts with / it's a relative server path
            const base = import.meta.env.VITE_API_URL || '';
            return currentUser.avatarUrl.startsWith('http') ? currentUser.avatarUrl : `${base}${currentUser.avatarUrl}`;
        }
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;
    };

    const handleAvatarUpload = async (file: File) => {
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await api.put('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser({ avatarUrl: res.data.avatarUrl });
            message.success('Cập nhật ảnh đại diện thành công!');
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Upload thất bại');
        } finally {
            setAvatarUploading(false);
        }
        return false; // prevent ant Upload default behavior
    };

    const handleAvatarDelete = async () => {
        try {
            await api.delete('/auth/avatar');
            updateUser({ avatarUrl: '' });
            message.success('Đã xóa ảnh đại diện');
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Xóa thất bại');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChangePassword = async (values: any) => {
        try {
            await api.put('/auth/change-password', {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            message.success('Đổi mật khẩu thành công!');
            setSettingsVisible(false);
            pwForm.resetFields();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Lỗi đổi mật khẩu');
        }
    };

    // ─── Build menu based on role ─────────────────────────
    const buildMenuItems = () => {
        if (role === 'student') {
            return [
                { key: '/student', icon: <CalendarOutlined />, label: 'Sự kiện' },
                { key: '/student/settings', icon: <SettingOutlined />, label: 'Cài đặt' },
            ];
        }

        // admin, union, lecturer
        const items: any[] = [
            { key: '/admin', icon: <CalendarOutlined />, label: 'Quản lý Sự kiện' },
        ];

        if (role !== 'lecturer') {
            items.push({ key: '/admin/students-tab', icon: <TeamOutlined />, label: 'Danh sách Sinh viên' });
        }

        items.push({ key: '/admin/logs-tab', icon: <HistoryOutlined />, label: 'Lịch sử Điểm danh' });
        items.push({ key: '/admin/reports', icon: <BarChartOutlined />, label: 'Báo cáo thống kê' });

        if (role === 'admin') {
            items.push({ key: '/admin/accounts', icon: <SafetyCertificateOutlined />, label: 'Quản lý Tài khoản' });
        }

        return items;
    };

    const menuItems = buildMenuItems();

    const handleMenuClick = (key: string) => {
        // Special keys that set tab state in AdminDashboard
        if (key === '/admin/students-tab') {
            navigate('/admin');
            // Dispatch custom event so AdminDashboard can switch tab
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'students' }));
        } else if (key === '/admin/logs-tab') {
            navigate('/admin');
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'logs' }));
        } else if (key === '/admin') {
            navigate('/admin');
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'events' }));
        } else {
            navigate(key);
        }
        if (isMobile) setDrawerVisible(false);
    };

    // Determine selected key based on current path
    const getSelectedKeys = () => {
        const path = location.pathname;
        if (path.startsWith('/admin/reports')) return ['/admin/reports'];
        if (path.startsWith('/admin/accounts')) return ['/admin/accounts'];
        if (path.startsWith('/admin/events')) return ['/admin'];
        if (path === '/admin') return ['/admin'];
        if (path.startsWith('/student/settings')) return ['/student/settings'];
        if (path.startsWith('/student')) return ['/student'];
        return [path];
    };


    // ─── User profile section at bottom of sidebar ─────────
    const userProfile = (
        <div style={{
            padding: collapsed ? '12px 8px' : '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: collapsed ? 'center' : 'flex-start',
                flexDirection: collapsed ? 'column' : 'row',
                gap: collapsed ? 8 : 12,
            }}>
                <Avatar 
                    size={collapsed ? 32 : 40} 
                    src={getAvatarSrc()}
                    style={{ flexShrink: 0, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)' }}
                    onClick={() => {
                        if (role === 'student') navigate('/student/settings');
                        else setSettingsVisible(true);
                    }}
                />
                {!collapsed && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ color: '#fff', fontSize: 14, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {currentUser.name}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block' }}>
                            {currentUser.username}
                        </Text>
                        <Space style={{ marginTop: 8 }} size={4}>
                            <Button 
                                type="text" 
                                size="small" 
                                icon={<SettingOutlined />}
                                onClick={() => {
                                    if (role === 'student') {
                                        navigate('/student/settings');
                                    } else {
                                        setSettingsVisible(true);
                                    }
                                    if (isMobile) setDrawerVisible(false);
                                }}
                                style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, padding: '0 6px' }}
                            >
                                Cài đặt
                            </Button>
                            <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.2)', margin: 0 }} />
                            <Button 
                                type="text" 
                                size="small" 
                                icon={<LogoutOutlined />} 
                                onClick={handleLogout}
                                style={{ color: '#ff4d4f', fontSize: 12, padding: '0 6px' }}
                            >
                                Đăng xuất
                            </Button>
                        </Space>
                    </div>
                )}
            </div>
            {collapsed && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <Button 
                        type="text" 
                        size="small" 
                        icon={<LogoutOutlined />} 
                        onClick={handleLogout}
                        style={{ color: '#ff4d4f', fontSize: 11 }}
                    />
                </div>
            )}
        </div>
    );

    const sideMenu = (
        <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKeys()}
            style={{ borderRight: 0, flex: 1 }}
            items={menuItems.map((item: any) => ({
                ...item,
                onClick: () => handleMenuClick(item.key),
            }))}
        />
    );

    const sidebarContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
                {sideMenu}
            </div>
            {userProfile}
        </div>
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
                        background: '#001529',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ 
                        height: 64, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        background: '#002140',
                        flexShrink: 0,
                    }}>
                        <Space>
                            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            {!collapsed && <Title level={4} style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600 }}>ATTENDANCE</Title>}
                        </Space>
                    </div>
                    {sidebarContent}
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
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1 }}>{sideMenu}</div>
                    {userProfile}
                </div>
            </Drawer>

            <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 260), transition: 'margin-left 0.2s' }}>
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
                    left: isMobile ? 0 : (collapsed ? 80 : 260),
                    transition: 'left 0.2s',
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
                        {!isMobile && (
                            <Space>
                                <Avatar size={28} src={getAvatarSrc()} />
                                <Typography.Text strong>{currentUser.name}</Typography.Text>
                            </Space>
                        )}
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

            {/* Settings Modal */}
            <Modal
                title="Cài đặt tài khoản"
                open={settingsVisible}
                onCancel={() => { setSettingsVisible(false); pwForm.resetFields(); }}
                footer={null}
                width={420}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                        <Spin spinning={avatarUploading} indicator={<LoadingOutlined />}>
                            <Avatar 
                                size={80} 
                                src={getAvatarSrc()}
                                style={{ border: '3px solid #1890ff' }}
                            />
                        </Spin>
                        <Upload
                            showUploadList={false}
                            accept="image/png,image/jpeg,image/webp"
                            beforeUpload={(file) => { handleAvatarUpload(file); return false; }}
                        >
                            <Button
                                type="primary"
                                shape="circle"
                                size="small"
                                icon={<CameraOutlined />}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                }}
                            />
                        </Upload>
                    </div>
                    <div>
                        <Text strong style={{ fontSize: 18, display: 'block' }}>{currentUser.name}</Text>
                        <Text type="secondary">@{currentUser.username}</Text>
                    </div>
                    {currentUser.avatarUrl && (
                        <Button
                            type="link"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={handleAvatarDelete}
                            style={{ marginTop: 4 }}
                        >
                            Xóa ảnh đại diện
                        </Button>
                    )}
                </div>

                <Divider>Đổi mật khẩu</Divider>

                <Form form={pwForm} layout="vertical" onFinish={handleChangePassword}>
                    <Form.Item name="oldPassword" label="Mật khẩu hiện tại" rules={[{ required: true, message: 'Bắt buộc' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
                    </Form.Item>
                    <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: 'Bắt buộc' }, { min: 4, message: 'Tối thiểu 4 ký tự' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Bắt buộc' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                                    return Promise.reject(new Error('Mật khẩu không khớp'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">
                        Đổi mật khẩu
                    </Button>
                </Form>
            </Modal>
        </Layout>
    );
};

export default DashboardLayout;
