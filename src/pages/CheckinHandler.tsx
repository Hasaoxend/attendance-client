import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Result, Spin, Button, Typography, message, Alert } from 'antd';
import { SafetyCertificateOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const { Title, Text } = Typography;

const CheckinHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    
    const [status, setStatus] = useState<'loading' | 'confirm' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [eventName, setEventName] = useState('');
    const [processing, setProcessing] = useState(false);

    const eventId = searchParams.get('e');
    const token = searchParams.get('t');

    const initializeHandler = useCallback(async () => {
        if (authLoading) return;

        // 1. Check Auth
        if (!user) {
            const currentPath = window.location.pathname + window.location.search;
            navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
            return;
        }

        // 2. Prepare Data
        try {
            const eventRes = await api.get(`/events/${eventId}`);
            setEventName(eventRes.data.name);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setStatus('confirm');
                    },
                    (geoErr) => {
                        console.error('GPS error:', geoErr);
                        setErrorMsg('Vui lòng cấp quyền định vị (GPS) để thực hiện điểm danh.');
                        setStatus('error');
                    }
                );
            } else {
                setErrorMsg('Trình duyệt của bạn không hỗ trợ định vị.');
                setStatus('error');
            }
        } catch (_initErr) {
            console.error('Initialization error:', _initErr);
            setErrorMsg('Không thể khởi tạo phiên điểm danh (Sự kiện không tồn tại hoặc lỗi mạng).');
            setStatus('error');
        }
    }, [authLoading, user, navigate, eventId]);
    

    useEffect(() => {
        if (!eventId || !token) {
            setErrorMsg('Liên kết điểm danh không hợp lệ.');
            setStatus('error');
            return;
        }
        initializeHandler();
    }, [eventId, token, initializeHandler]);

    const handleCheckin = async () => {
        if (!location) {
            message.error('Thiếu thông tin vị trí');
            return;
        }

        setProcessing(true);
        try {
            const res = await api.post('/checkins', {
                eventId: parseInt(eventId!),
                token: token!,
                lat: location.lat,
                lng: location.lng
            });

            navigate('/student/success', { 
                state: { 
                    eventName: res.data.eventName,
                    checkinTime: res.data.checkinTime,
                    score: res.data.score
                } 
            });
        } catch (err: any) {
            console.error('Checkin error:', err);
            setErrorMsg(err.response?.data?.message || 'Điểm danh thất bại. Vui lòng thử lại.');
            setStatus('error');
        } finally {
            setProcessing(false);
        }
    };

    if (status === 'loading') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
                <Card style={{ width: 350, textAlign: 'center', borderRadius: 16 }}>
                    <Spin size="large" tip="Đang thiết lập bảo mật..." />
                    <div style={{ marginTop: 24 }}>
                        <Text type="secondary">Vui lòng chờ trong giây lát</Text>
                    </div>
                </Card>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
                <Card style={{ width: 400, borderRadius: 16 }}>
                    <Result
                        status="error"
                        title="Lỗi Điểm danh"
                        subTitle={errorMsg}
                        extra={[
                            <Button type="primary" key="retry" onClick={() => window.location.reload()}>Thử lại</Button>,
                            <Button key="home" onClick={() => navigate('/')}>Quay lại trang chủ</Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: 20 }}>
            <Card style={{ width: 450, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <Title level={3} style={{ marginTop: 16 }}>Xác nhận Điểm danh</Title>
                    <Title level={4} type="secondary" style={{ marginTop: 0 }}>{eventName || 'Đang tải thông tin sự kiện...'}</Title>
                    <Text type="secondary">Chào mừng, {user?.name}</Text>
                </div>

                <Alert
                    message="Thông tin bảo mật"
                    description={
                        <div style={{ fontSize: 12 }}>
                            <div style={{ marginBottom: 4 }}><EnvironmentOutlined /> Đã xác định vị trí GPS</div>
                        </div>
                    }
                    type="success"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Button 
                    type="primary" 
                    size="large" 
                    block 
                    loading={processing} 
                    onClick={handleCheckin}
                    style={{ height: 50, borderRadius: 8, fontSize: 18, fontWeight: 'bold' }}
                >
                    ĐIỂM DANH NGAY
                </Button>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Lưu ý: Mọi hành vi gian lận (fake GPS, dùng nhiều máy) sẽ bị hệ thống tự động khóa tài khoản.
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default CheckinHandler;
