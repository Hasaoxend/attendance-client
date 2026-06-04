import { useState, useEffect } from 'react';
import { 
    Typography, 
    Card, 
    Form, 
    Input, 
    Button, 
    message, 
    Avatar,
    Grid
} from 'antd';
import { 
    ArrowLeftOutlined, 
    UserOutlined, 
    SafetyCertificateOutlined, 
    SaveOutlined,
    LockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const StudentSettings = () => {
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [form] = Form.useForm();
    const [pwForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Unified Light Theme
    const T = {
        textPrimary: '#000',
        textSecondary: 'rgba(0,0,0,0.55)',
        labelColor: 'rgba(0,0,0,0.85)',
        cardBg: '#fff',
        cardBorder: '1px solid #f0f0f0',
        btnBg: '#1890ff',
        btnColor: '#fff',
    };

    useEffect(() => {
        form.setFieldsValue({
            name: user.name,
            username: user.username,
            email: user.email || ''
        });
    }, [user, form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const updatedUser = { ...user, name: values.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            message.success('Cập nhật hồ sơ thành công!');
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra khi cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const onChangePassword = async (values: any) => {
        setPwLoading(true);
        try {
            const res = await api.put('/auth/change-password', {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
            });
            message.success(res.data.message || 'Đổi mật khẩu thành công!');
            pwForm.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setPwLoading(false);
        }
    };

    const menuItems = [
        { key: '/student', label: 'Sự kiện', icon: <UserOutlined />, path: '/student' },
    ];

    const content = (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
            {/* Profile Section */}
            <Card 
                style={{ marginBottom: 20, background: T.cardBg, border: T.cardBorder, borderRadius: 16 }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Avatar size={100} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                    <Title level={4} style={{ color: T.textPrimary, marginTop: 16, marginBottom: 0 }}>{user.name}</Title>
                    <Text style={{ color: T.textSecondary }}>Mã sinh viên: {user.username}</Text>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label={<span style={{ color: T.labelColor }}>Họ và tên</span>} rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} size="large" />
                    </Form.Item>
                    <Form.Item name="username" label={<span style={{ color: T.labelColor }}>Mã số sinh viên</span>}>
                        <Input disabled prefix={<SafetyCertificateOutlined />} size="large" />
                    </Form.Item>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        block 
                        loading={loading}
                        icon={<SaveOutlined />}
                        style={{ 
                            height: 45, 
                            borderRadius: 8, 
                            background: T.btnBg, 
                            color: T.btnColor, 
                            border: 'none',
                            fontWeight: 600,
                            marginTop: 10
                        }}
                    >
                        LƯU THAY ĐỔI
                    </Button>
                </Form>
            </Card>

            {/* Password Change Section */}
            <Card 
                title={<span style={{ color: T.textPrimary }}><LockOutlined /> Đổi mật khẩu</span>}
                style={{ marginBottom: 20, background: T.cardBg, border: T.cardBorder, borderRadius: 16 }}
            >
                <Form form={pwForm} layout="vertical" onFinish={onChangePassword}>
                    <Form.Item 
                        name="oldPassword" 
                        label={<span style={{ color: T.labelColor }}>Mật khẩu hiện tại</span>} 
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} size="large" placeholder="Nhập mật khẩu cũ" />
                    </Form.Item>
                    <Form.Item 
                        name="newPassword" 
                        label={<span style={{ color: T.labelColor }}>Mật khẩu mới</span>} 
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                            { min: 4, message: 'Mật khẩu mới phải có ít nhất 4 ký tự' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} size="large" placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                    <Form.Item 
                        name="confirmPassword" 
                        label={<span style={{ color: T.labelColor }}>Xác nhận mật khẩu mới</span>} 
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} size="large" placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        block 
                        loading={pwLoading}
                        icon={<LockOutlined />}
                        style={{ 
                            height: 45, 
                            borderRadius: 8, 
                            background: '#ff4d4f', 
                            color: '#fff', 
                            border: 'none',
                            fontWeight: 600,
                            marginTop: 10
                        }}
                    >
                        ĐỔI MẬT KHẨU
                    </Button>
                </Form>
            </Card>

            <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 40 }}>
                <Button 
                    type="link" 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/student')}
                    style={{ color: T.textSecondary }}
                >
                    Quay lại trang chủ
                </Button>
            </div>
        </div>
    );

    return (
        <DashboardLayout 
            title="Cài đặt tài khoản"
            menuItems={menuItems}
            contentStyle={{ padding: isMobile ? 12 : 24, background: '#f5f5f5', border: 'none' }}
        >
            {content}
        </DashboardLayout>
    );
};

export default StudentSettings;
