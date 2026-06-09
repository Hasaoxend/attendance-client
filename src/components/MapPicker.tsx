import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input, Row, Col, Space, Typography, Button, message } from 'antd';
import { CompassOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Fix marker icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapPickerProps {
    value?: { lat: number, lng: number };
    radius?: number;
    onChange?: (value: { lat: number, lng: number }) => void;
}

const MapPicker = ({ value, onChange, radius = 50 }: MapPickerProps) => {
    const defaultPos = { lat: 10.762622, lng: 106.660172 };
    const [position, setPosition] = useState(value || defaultPos);

    useEffect(() => {
        if (value && (value.lat !== position.lat || value.lng !== position.lng)) {
            setPosition(value);
        }
    }, [value, position.lat, position.lng]);

    const LocationMarker = () => {
        const map = useMapEvents({
            click(e) {
                const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                setPosition(newPos);
                if (onChange) onChange(newPos);
            },
        });

        useEffect(() => {
            map.setView([position.lat, position.lng], map.getZoom());
        }, [map, position.lat, position.lng]);

        return <Marker position={[position.lat, position.lng]} icon={DefaultIcon} />;
    };

    const handleManualChange = (type: 'lat' | 'lng', val: string) => {
        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
            const newPos = { ...position, [type]: numVal };
            setPosition(newPos);
            if (onChange) onChange(newPos);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            message.error('Trình duyệt không hỗ trợ định vị');
            return;
        }

        const hide = message.loading('Đang lấy vị trí...', 0);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                hide();
                setPosition(newPos);
                if (onChange) onChange(newPos);
                message.success('Đã cập nhật vị trí hiện tại');
            },
            (err) => {
                hide();
                message.error('Không thể lấy vị trí: ' + err.message);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16} align="bottom">
                <Col span={9}>
                    <Text type="secondary">Vĩ độ (Latitude)</Text>
                    <Input 
                        type="number" 
                        value={position.lat} 
                        step="0.000001"
                        onChange={(e) => handleManualChange('lat', e.target.value)} 
                        placeholder="Vĩ độ"
                    />
                </Col>
                <Col span={9}>
                    <Text type="secondary">Kinh độ (Longitude)</Text>
                    <Input 
                        type="number" 
                        value={position.lng} 
                        step="0.000001"
                        onChange={(e) => handleManualChange('lng', e.target.value)} 
                        placeholder="Kinh độ"
                    />
                </Col>
                <Col span={6}>
                    <Button 
                        icon={<CompassOutlined />} 
                        onClick={handleGetCurrentLocation}
                        block
                        type="primary"
                        ghost
                    >
                        Vị trí tôi
                    </Button>
                </Col>
            </Row>
            <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                <MapContainer center={[position.lat, position.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker />
                    <Circle 
                        center={[position.lat, position.lng]} 
                        radius={radius} 
                        pathOptions={{ color: '#1890ff', fillColor: '#1890ff', fillOpacity: 0.2 }} 
                    />
                </MapContainer>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>* Bạn có thể nhập tọa độ tay hoặc nhấp chuột vào bản đồ để chọn vị trí.</Text>
        </Space>
    );
};

export default MapPicker;
