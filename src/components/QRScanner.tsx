import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Spin, message, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Text } = Typography;


interface QRScannerProps {
    location: { lat: number; lng: number } | null;
    onSuccess: () => void;
}

import { useNavigate } from 'react-router-dom';

const QRScanner = ({ location, onSuccess }: QRScannerProps) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'reader',
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                videoConstraints: {
                    facingMode: 'environment'
                },
                rememberLastUsedCamera: true,
                supportedScanTypes: [0] // 0 = HTML5_QRCODE_SCAN_TYPE_CAMERA
            },
            false
        );

        const onScanSuccess = async (decodedText: string) => {
            if (loading) return;
            
            let eventId, token;

            try {
                // Try parsing as URL format: http://.../checkin?e=eventId&t=token
                const url = new URL(decodedText);
                eventId = url.searchParams.get('e');
                token = url.searchParams.get('t');
            } catch {
                // Fallback for old format: "eventId:token"
                const parts = decodedText.split(':');
                if (parts.length >= 2) {
                    eventId = parts[0];
                    token = parts[1];
                }
            }
            
            if (!eventId || !token) {
                message.error('Mã QR không hợp lệ');
                return;
            }

            if (!location) {
                message.warning('Vui lòng bật định vị GPS để điểm danh');
                return;
            }

            setLoading(true);
            scanner.clear();

            try {
                const stored = localStorage.getItem('deviceId');
                const deviceId = stored || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
                if (!stored) localStorage.setItem('deviceId', deviceId);

                const res = await api.post('/checkins', {
                    eventId: parseInt(eventId),
                    token,
                    lat: location.lat,
                    lng: location.lng,
                    deviceId
                });
                
                // Navigate to success page with data FIRST, then close modal
                navigate('/student/success', { 
                    state: { 
                        eventName: res.data.eventName,
                        checkinTime: res.data.checkinTime,
                        score: res.data.score,
                        trainingPoints: res.data.trainingPoints
                    },
                    replace: true
                });
                
                // Delay onSuccess so navigate completes before modal unmounts
                setTimeout(() => onSuccess(), 300);
            } catch (err: any) {
                message.error(err.response?.data?.message || 'Điểm danh thất bại');
                // Re-initialize scanner on failure if needed, or just let the user click again
                window.location.reload(); 
            } finally {
                setLoading(false);
            }
        };

        scanner.render(onScanSuccess, () => {
            // Quietly handle errors
        });

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [location, loading, onSuccess, navigate]);

    return (
        <div style={{ background: 'transparent' }}>
            <div id="reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}></div>
            {loading && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Spin tip={<Text style={{ color: '#fff' }}>Đang xác thực đa yếu tố...</Text>} />
                </div>
            )}
            <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 13 }}>
                    <InfoCircleOutlined /> <strong>Hướng dẫn:</strong> Vui lòng đưa mã QR vào khung hình. Hệ thống sẽ tự động kiểm tra GPS của bạn.
                </Text>
            </div>
        </div>
    );
};

export default QRScanner;
