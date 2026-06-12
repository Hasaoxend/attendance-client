import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Content } = Layout;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const onFinish = async (values: Record<string, string>) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', values);
            login(res.data.user, res.data.token);
            
            message.success('Đăng nhập thành công!');
            
            const redirectPath = searchParams.get('redirect');
            if (redirectPath) {
                navigate(decodeURIComponent(redirectPath));
                return;
            }

            if (res.data.user.role === 'student') {
                navigate('/student');
            } else {
                navigate('/admin');
            }
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không đúng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                        <Title level={2} style={{ marginTop: 16 }}>ĐIỂM DANH SINH VIÊN</Title>
                        <Text type="secondary">Hệ thống xác thực đa yếu tố chống gian lận</Text>
                    </div>

                    <Form name="login" onFinish={onFinish} layout="vertical" size="large">
                        <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
                        </Form.Item>

                        <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 45, borderRadius: 8 }}>
                                ĐĂNG NHẬP
                            </Button>
                        </Form.Item>
                    </Form>
                    
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Đồ Án Tốt Nghiệp 2026
                        </Text>
                    </div>
                </Card>
            </Content>
        </Layout>
    );
};

export default Login;
