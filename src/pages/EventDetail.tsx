import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Tag, Typography, Button, Space, Card, Row, Col, Statistic, Breadcrumb, message, Modal } from 'antd';
import {ArrowLeftOutlined, CalendarOutlined, EnvironmentOutlined, CheckCircleOutlined, CloseCircleOutlined, QrcodeOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import QRGenerator from '../components/QRGenerator';

const { Title, Text } = Typography;

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<any>(null);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isQRModalVisible, setIsQRModalVisible] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/reports/export/excel', {
                params: { type: 'attendance', eventId: id },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `diem_danh_${event?.name?.replace(/[^a-zA-Z0-9]/g, '_') || id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('Xuất Excel thành công!');
        } catch {
            message.error('Lỗi xuất Excel');
        }
        setExporting(false);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [eventRes, registrationsRes] = await Promise.all([
                api.get(`/events/${id}`),
                api.get(`/events/${id}/registrations`)
            ]);
            setEvent(eventRes.data);
            setAttendance(registrationsRes.data);
        } catch (_err) {
            message.error('Không thể tải thông tin sự kiện');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!event && !loading) return <div>Không tìm thấy sự kiện</div>;

    const stats = {
        present: attendance.filter(s => s.status === 'checked_in').length,
        absent: attendance.filter(s => s.status === 'absent').length,
        total: attendance.length
    };

    const columns = [
        { title: 'MSSV', dataIndex: 'username', key: 'username', width: 110 },
        { title: 'Họ và tên', dataIndex: 'name', key: 'name', width: 180 },
        { title: 'Mã SV', dataIndex: 'student_code', key: 'student_code', width: 110 },
        { title: 'Lớp', dataIndex: 'class_name', key: 'class_name', width: 120 },
        { title: 'Khoa', dataIndex: 'faculty', key: 'faculty', width: 160 },
        { title: 'Viện', dataIndex: 'institute', key: 'institute', width: 180 },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status: string) => (
                status === 'checked_in'
                    ? <Tag icon={<CheckCircleOutlined />} color="success">Đã điểm danh</Tag>
                    : <Tag icon={<CloseCircleOutlined />} color="error">Vắng</Tag>
            )
        },
        {
            title: 'Đăng ký lúc',
            dataIndex: 'registered_at',
            key: 'registered_at',
            width: 140,
            render: (t: any) => t ? dayjs(t).format('HH:mm DD/MM') : '-'
        },
        {
            title: 'Điểm danh lúc',
            dataIndex: 'checkin_time',
            key: 'checkin_time',
            width: 140,
            render: (t: any) => t ? dayjs(t).format('HH:mm DD/MM') : '-'
        },
        {
            title: 'Địa chỉ IP',
            dataIndex: 'ip_address',
            key: 'ip_address',
            width: 140,
            render: (ip: string) => ip ? <Text copyable style={{ fontSize: 12 }}>{ip}</Text> : '-'
        },
        {
            title: 'ID Thiết bị',
            dataIndex: 'device_id',
            key: 'device_id',
            width: 180,
            render: (d: string) => d ? <Text copyable ellipsis style={{ fontSize: 11, maxWidth: 160 }}>{d}</Text> : '-'
        }
    ];

    return (
        <DashboardLayout title="Chi tiết Sự kiện">
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item><a onClick={() => navigate('/admin')}>Quản trị</a></Breadcrumb.Item>
                <Breadcrumb.Item>Chi tiết sự kiện</Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin')}>Quay lại</Button>
                    <Title level={3} style={{ margin: 0 }}>{event?.name}</Title>
                </Space>
                <Space>
                    <Button type="primary" size="large" icon={<FileExcelOutlined />} onClick={handleExport} loading={exporting} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                        Xuất Excel
                    </Button>
                    <Button type="primary" size="large" icon={<QrcodeOutlined />} onClick={() => setIsQRModalVisible(true)}>
                        Hiển thị Mã QR
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                <Col span={16}>
                    <Card title="Thông tin cơ bản" loading={loading}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Space direction="vertical">
                                    <Text type="secondary"><CalendarOutlined /> Thời gian:</Text>
                                    <Text strong>{dayjs(event?.start_time).format('DD/MM/YYYY HH:mm')} - {dayjs(event?.end_time).format('HH:mm')}</Text>
                                    
                                    <Text type="secondary" style={{ marginTop: 8 }}><EnvironmentOutlined /> Địa điểm:</Text>
                                    <Text strong>{event?.location_name || 'Chưa cập nhật tên địa điểm'}</Text>
                                    <Text type="secondary">Tọa độ: {event?.location_lat}, {event?.location_lng}</Text>
                                    <Text type="secondary">Bán kính cho phép: {event?.radius}m</Text>

                                    <Text type="secondary" style={{ marginTop: 8 }}>Loại sự kiện:</Text>
                                    {event?.event_type ? <Tag color="purple">{event.event_type}</Tag> : <Text type="secondary">Chưa cập nhật</Text>
                                    }

                                    <Text type="secondary" style={{ marginTop: 8 }}>Giấy quyết định:</Text>
                                    {event?.decision_image_url ? (
                                        <a href={event.decision_image_url} target="_blank" rel="noreferrer">Xem hình ảnh</a>
                                    ) : (
                                        <Text type="secondary">Chưa có</Text>
                                    )}
                                </Space>
                            </Col>
                            <Col span={12}>
                                <Space direction="vertical">
                                    <Text type="secondary">Chế độ QR:</Text>
                                    <Tag color={event?.qr_type === 'dynamic' ? 'blue' : 'orange'}>
                                        {event?.qr_type === 'dynamic' ? 'Linh hoạt (Thay đổi mỗi 30s)' : 'Cố định (Một mã duy nhất)'}
                                    </Tag>
                                    
                                    <Text type="secondary" style={{ marginTop: 8 }}>Điểm rèn luyện:</Text>
                                    <Text strong>{event?.score} Điểm</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    <Card title="Danh sách Sinh viên & Trạng thái" style={{ marginTop: 24 }} loading={loading}>
                        <Table 
                            dataSource={attendance} 
                            columns={columns} 
                            rowKey="id" 
                            pagination={{ pageSize: 15 }}
                            scroll={{ x: 1400 }}
                        />
                    </Card>
                </Col>

                <Col span={8}>
                    <Card title="Thống kê điểm danh">
                        <Statistic 
                            title="Số sinh viên đã điểm danh" 
                            value={stats.present} 
                            suffix={`/ ${stats.total}`}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                        <div style={{ marginTop: 16 }}>
                            <Statistic 
                                title="Số sinh viên vắng mặt" 
                                value={stats.absent} 
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<CloseCircleOutlined />}
                            />
                        </div>
                        <div style={{ marginTop: 24 }}>
                            <Button block type="dashed" onClick={fetchData}>Làm mới dữ liệu</Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Modal QR Code */}
            <Modal
                title={`Mã QR: ${event?.name}`}
                open={isQRModalVisible}
                onCancel={() => setIsQRModalVisible(false)}
                footer={null}
                centered
            >
                {event && (
                    <QRGenerator 
                        eventId={event.id} 
                        eventName={event.name} 
                    />
                )}
            </Modal>
        </DashboardLayout>
    );
};

export default EventDetail;
