import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Typography, Space, Tag } from 'antd';
import { CheckCircleFilled, ArrowLeftOutlined, StarFilled, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CheckinSuccess = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    
    if (!state) {
        return (
            <div className="premium-bg">
                <Card className="glass-card" style={{ maxWidth: 400, textAlign: 'center' }}>
                    <Title level={3}>Không có dữ liệu</Title>
                    <Text>Vui lòng thực hiện điểm danh qua mã QR.</Text>
                    <Button type="primary" block style={{ marginTop: 20 }} onClick={() => navigate('/student')}>
                        Quay lại
                    </Button>
                </Card>
            </div>
        );
    }

    const { eventName, checkinTime, score, trainingPoints } = state;

    return (
        <div className="premium-bg">
            <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 40 }} className="animate-success">
                <CheckCircleFilled style={{ fontSize: 100, color: '#fff', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }} />
                <Title level={1} style={{ color: '#fff', marginTop: 24, marginBottom: 0, fontSize: 32, fontWeight: 800 }}>
                    THÀNH CÔNG!
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Đã ghi nhận điểm danh</Text>
            </div>

            <Card className="glass-card" style={{ width: '100%', maxWidth: 400 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                        <Tag color="#fff" style={{ color: '#764ba2', border: 'none', borderRadius: 20, padding: '4px 16px', fontSize: 13, fontWeight: 600 }}>
                            <StarFilled /> +{score} ĐIỂM DANH
                        </Tag>
                        {trainingPoints > 0 && (
                            <Tag color="#ffd700" style={{ color: '#000', border: 'none', borderRadius: 20, padding: '4px 16px', fontSize: 13, fontWeight: 600 }}>
                                <StarFilled /> +{trainingPoints} ĐIỂM RL
                            </Tag>
                        )}
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 20 }}>
                        <div style={{ marginBottom: 20 }}>
                            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: 12 }}>SỰ KIỆN</Text>
                            <Text strong style={{ fontSize: 18, color: '#fff' }}>{eventName}</Text>
                        </div>
                        
                        <div>
                            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: 12 }}>THỜI GIAN</Text>
                            <Text style={{ color: '#fff' }}>{dayjs(checkinTime).format('HH:mm [ngày] DD/MM/YYYY')}</Text>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', opacity: 0.7 }}>
                        <Text style={{ fontSize: 12, color: '#fff' }}>
                            <InfoCircleOutlined /> Thông tin thiết bị và vị trí đã được xác thực bảo mật.
                        </Text>
                    </div>

                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/student')} 
                        block
                        style={{ 
                            height: 56, 
                            borderRadius: 28, 
                            background: '#fff', 
                            color: '#764ba2', 
                            border: 'none',
                            fontWeight: 700,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                        }}
                    >
                        VỀ TRANG CHỦ
                    </Button>
                </Space>
            </Card>
        </div>
    );
};

export default CheckinSuccess;
