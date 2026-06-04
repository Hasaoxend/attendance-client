import { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Progress, message, Tag } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';

const { Title, Text } = Typography;

interface QRGeneratorProps {
    eventId: number;
    eventName: string;
}

const QRGenerator = ({ eventId, eventName }: QRGeneratorProps) => {
    const [token, setToken] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [qrType, setQrType] = useState('dynamic');

    const fetchToken = useCallback(async () => {
        try {
            const res = await api.get(`/events/${eventId}/qr-token`);
            setToken(res.data.token);
            setQrType(res.data.qrType || 'dynamic');
            setTimeLeft(30);
        } catch (_err) {
            message.error('Failed to update QR token');
        }
    }, [eventId]);

    useEffect(() => {
        fetchToken();
        const interval = setInterval(() => {
            if (qrType === 'static') return; // No countdown for static QR
            
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchToken();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [fetchToken, qrType]);

    // Format: http://origin/checkin?e=eventId&t=token
    const qrValue = `${window.location.origin}/checkin?e=${eventId}&t=${token}`;

    return (
        <Card style={{ textAlign: 'center', width: 350, margin: '0 auto' }}>
            <Title level={4}>{eventName}</Title>
            <div style={{ padding: 20, background: 'white', display: 'inline-block', borderRadius: 8 }}>
                <QRCodeSVG value={qrValue} size={256} />
            </div>
            <div style={{ marginTop: 16 }}>
                {qrType === 'dynamic' ? (
                    <>
                        <Text type="secondary">Mã QR hết hạn sau {timeLeft} giây</Text>
                        <Progress percent={(timeLeft / 30) * 100} showInfo={false} strokeColor="#1890ff" />
                    </>
                ) : (
                    <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>CHẾ ĐỘ QR CỐ ĐỊNH (KHÓA)</Tag>
                )}
            </div>
            <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Yêu cầu bật GPS, định danh thiết bị và phiên đăng nhập để điểm danh.
                </Text>
            </div>
        </Card>
    );
};

export default QRGenerator;
