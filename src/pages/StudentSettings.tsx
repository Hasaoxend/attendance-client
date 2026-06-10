import { useState, useEffect } from 'react';
import { 
    Typography, 
    Card, 
    Form, 
    Input, 
    Button, 
    message, 
    Avatar,
    Grid,
    Upload,
    Spin
} from 'antd';
import { 
    ArrowLeftOutlined, 
    UserOutlined, 
    SafetyCertificateOutlined, 
    SaveOutlined,
    LockOutlined,
    CameraOutlined,
    DeleteOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

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
    const [avatarUploading, setAvatarUploading] = useState(false);
    const { user, updateUser } = useAuth();
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUser = user || localUser;

    // Avatar: use custom if available, fallback to DiceBear
    const getAvatarSrc = () => {
        if (currentUser.avatarUrl) {
            const base = import.meta.env.VITE_API_URL || '';
            return currentUser.avatarUrl.startsWith('http') ? currentUser.avatarUrl : `${base}${currentUser.avatarUrl}`;
        }
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;
    };

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
            name: currentUser.name,
            username: currentUser.username,
            email: currentUser.email || ''
        });
    }, [currentUser, form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            updateUser({ name: values.name });
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
        return false;
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
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                        <Spin spinning={avatarUploading} indicator={<LoadingOutlined />}>
                            <Avatar size={100} src={getAvatarSrc()} />
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
                                    bottom: 2,
                                    right: 2,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                }}
                            />
                        </Upload>
                    </div>
                    {currentUser.avatarUrl && (
                        <div>
                            <Button
                                type="link"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={handleAvatarDelete}
                            >
                                Xóa ảnh đại diện
                            </Button>
                        </div>
                    )}
                    <Title level={4} style={{ color: T.textPrimary, marginTop: 8, marginBottom: 0 }}>{currentUser.name}</Title>
                    <Text style={{ color: T.textSecondary }}>Mã sinh viên: {currentUser.username}</Text>
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
