import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Space, Typography, Tag, message, Radio, Card, Col, Row, Statistic, Grid, Switch, Upload, Select } from 'antd';
import { 
    UserOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    QrcodeOutlined,
    CalendarOutlined,
    HistoryOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    UploadOutlined
} from '@ant-design/icons';
import { Popconfirm, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import QRGenerator from '../components/QRGenerator';
import MapPicker from '../components/MapPicker';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isLecturer = user?.role === 'lecturer';
    const screens = useBreakpoint();
    const isMobile = screens.md === false;
    
    const [events, setEvents] = useState([]);
    const [students, setStudents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('events');

    // Listen for sidebar tab-switch events from DashboardLayout
    useEffect(() => {
        const handler = (e: any) => setActiveTab(e.detail);
        window.addEventListener('admin-tab-change', handler);
        return () => window.removeEventListener('admin-tab-change', handler);
    }, []);
    
    // Modals
    const [isEventModalVisible, setIsEventModalVisible] = useState(false);
    const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
    const [isQRModalVisible, setIsQRModalVisible] = useState(false);
    
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [form] = Form.useForm();
    const [studentForm] = Form.useForm();

    // Event decision image upload (Admin)
    const [decisionFile, setDecisionFile] = useState<File | null>(null);
    const [decisionUploading, setDecisionUploading] = useState(false);

    const facultyOptions = Array.from(new Set(students.map((s: any) => s.faculty).filter(Boolean)))
        .sort()
        .map((faculty) => ({ value: faculty, label: faculty }));

    const instituteOptions = Array.from(new Set(students.map((s: any) => s.institute).filter(Boolean)))
        .sort()
        .map((institute) => ({ value: institute, label: institute }));

    const fetchEvents = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh sách sự kiện');
        }
    }, []);

    const fetchStudents = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh sách sinh viên');
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await api.get('/history/admin');
            setLogs(res.data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải lịch sử điểm danh');
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadAllData = async () => {
            if (!isMounted) return;
            await Promise.all([fetchEvents(), fetchStudents(), fetchLogs()]);
        };
        loadAllData();
        return () => { isMounted = false; };
    }, [fetchEvents, fetchStudents, fetchLogs]);

    const handleOpenCreateModal = () => {
        setEditingEvent(null);
        setDecisionFile(null);
        form.resetFields();
        setIsEventModalVisible(true);
    };

    const handleOpenEditModal = (event: any) => {
        setEditingEvent(event);
        setDecisionFile(null);
        form.setFieldsValue({
            ...event,
            timeRange: [dayjs(event.start_time), dayjs(event.end_time)],
            location: { lat: Number(event.location_lat), lng: Number(event.location_lng) },
            content: event.content || '',
            training_points: event.training_points || 0,
            priority: event.priority || 0,
            is_active: event.is_active,
            location_name: event.location_name || '',
            event_type: event.event_type || '',
            allowed_faculty: event.allowed_faculty || '',
            allowed_institute: event.allowed_institute || ''
        });
        setIsEventModalVisible(true);
    };

    const handleToggleStatus = async (id: number) => {
        try {
            await api.patch(`/events/${id}/toggle`);
            message.success('Cập nhật trạng thái thành công');
            fetchEvents();
        } catch (error) {
            console.error(error);
            message.error('Không thể cập nhật trạng thái');
        }
    };

    const handleEventSubmit = async (values: any) => {
        try {
            const payload = {
                ...values,
                training_points: Number(values.training_points || 0),
                start_time: values.timeRange[0].toISOString(),
                end_time: values.timeRange[1].toISOString(),
                location_lat: values.location.lat,
                location_lng: values.location.lng,
                allowed_faculty: values.allowed_faculty || '',
                allowed_institute: values.allowed_institute || '',
            };

            let eventId: number | null = editingEvent?.id || null;

            if (editingEvent) {
                const res = await api.put(`/events/${editingEvent.id}`, payload);
                eventId = res.data?.event?.id ?? editingEvent.id;
                message.success('Cập nhật sự kiện thành công');
            } else {
                const res = await api.post('/events', payload);
                eventId = res.data?.event?.id ?? null;
                message.success('Tạo sự kiện thành công');
            }

            // Upload decision image if provided (requires event id)
            if (decisionFile) {
                if (!eventId) {
                    message.warning('Chưa lấy được ID sự kiện để upload ảnh');
                } else {
                    setDecisionUploading(true);
                    try {
                        const fd = new FormData();
                        fd.append('image', decisionFile);
                        await api.post(`/events/${eventId}/decision-image`, fd, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        message.success('Upload giấy quyết định thành công');
                    } finally {
                        setDecisionUploading(false);
                        setDecisionFile(null);
                    }
                }
            }

            setIsEventModalVisible(false);
            form.resetFields();
            fetchEvents();
        } catch (err: any) {
            setDecisionUploading(false);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Lỗi khi xử lý sự kiện';
            message.error(errorMsg);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        try {
            await api.delete(`/events/${id}`);
            message.success('Xóa sự kiện thành công');
            fetchEvents();
        } catch (error) {
            console.error(error);
            message.error('Không thể xóa sự kiện');
        }
    };

    const handleOpenCreateStudentModal = () => {
        setEditingStudent(null);
        studentForm.resetFields();
        setIsStudentModalVisible(true);
    };

    const handleOpenEditStudentModal = (student: any) => {
        setEditingStudent(student);
        studentForm.setFieldsValue(student);
        setIsStudentModalVisible(true);
    };

    const handleStudentSubmit = async (values: any) => {
        try {
            if (editingStudent) {
                await api.put(`/students/${editingStudent.id}`, values);
                message.success('Cập nhật sinh viên thành công');
            } else {
                await api.post('/students', values);
                message.success('Thêm sinh viên thành công');
            }
            setIsStudentModalVisible(false);
            studentForm.resetFields();
            fetchStudents();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Lỗi khi xử lý sinh viên');
        }
    };

    const handleDeleteStudent = async (id: number) => {
        try {
            await api.delete(`/students/${id}`);
            message.success('Xóa sinh viên thành công');
            fetchStudents();
        } catch (error) {
            console.error(error);
            message.error('Không thể xóa sinh viên');
        }
    };

    const eventColumns: any[] = [
        { 
            title: 'Tên sự kiện', 
            dataIndex: 'name', 
            key: 'name', 
            render: (text: string, record: any) => (
                <Space>
                    {record.priority === 1 && <Tag color="error" className="pulse-animation">GẤP</Tag>}
                    <strong>{text}</strong>
                </Space>
            ), 
            width: isMobile ? 180 : 'auto' 
        },
        { 
            title: 'Thời gian', 
            key: 'time',
            width: 130,
            render: (record: any) => (
                <Text style={{ fontSize: '12px' }}>
                    {dayjs(record.start_time).format('DD/MM HH:mm')} - {dayjs(record.end_time).format('HH:mm')}
                </Text>
            )

        },
        {
            title: 'Tham gia',
            key: 'attendance',
            width: 120,
            render: (record: any) => {
                const reg = Number(record.registered_count || 0);
                const checked = Number(record.checked_in_count || 0);
                return (
                    <Tag color={reg > 0 && checked >= reg ? 'success' : 'default'}>
                        {checked}/{reg}
                    </Tag>
                );
            }
        },
        {
            title: 'Loại QR',
            dataIndex: 'qr_type',
            key: 'qr_type',
            width: 100,
            render: (type: string) => (
                <Tag color={type === 'dynamic' ? 'blue' : 'orange'}>
                    {type === 'dynamic' ? 'Linh hoạt' : 'Cố định'}
                </Tag>
            )
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 100,
            render: (record: any) => (
                <Switch 
                    checked={record.is_active} 
                    onChange={() => handleToggleStatus(record.id)} 
                    checkedChildren="Bật" 
                    unCheckedChildren="Tắt"
                    size="small"
                />
            )
        },
        { 
            title: 'Thao tác', 
            key: 'actions',
            fixed: isMobile ? 'right' : undefined,
            width: isMobile ? 180 : 350,
            render: (record: any) => (
                <Space wrap>
                    <Button 
                        size="small"
                        type="primary" 
                        ghost 
                        icon={<QrcodeOutlined />} 
                        onClick={() => { setSelectedEvent(record); setIsQRModalVisible(true); }}
                    >
                        QR
                    </Button>
                    {!isLecturer && (
                        <Button 
                            size="small"
                            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
                            onClick={() => handleOpenEditModal(record)}
                        >
                            Sửa
                        </Button>
                    )}
                    {!isLecturer && (
                        <Popconfirm
                            title="Xóa sự kiện?"
                            onConfirm={() => handleDeleteEvent(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okType="danger"
                        >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                    {!isMobile && (
                        <Button 
                            size="small"
                            icon={<HistoryOutlined />} 
                            onClick={() => navigate(`/admin/events/${record.id}`)}
                        >
                            Báo cáo
                        </Button>
                    )}
                </Space>
            )
        }
    ];



    const renderContent = () => {
        switch (activeTab) {
            case 'events':
                return (
                    <>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                            <Col xs={24} sm={12} md={8}>
                                <Card size="small">
                                    <Statistic title="Tổng sự kiện" value={events.length} prefix={<CalendarOutlined />} />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card size="small">
                                    <Statistic title="Đang diễn ra" value={events.filter((e: any) => dayjs().isBetween(dayjs(e.start_time), dayjs(e.end_time))).length} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
                                </Card>
                            </Col>
                            <Col xs={24} sm={24} md={8}>
                                <Card size="small">
                                    <Statistic title="Tổng sinh viên" value={students.length} prefix={<UserOutlined />} />
                                </Card>
                            </Col>
                        </Row>
                        <div style={{ marginBottom: 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
                            <Title level={4} style={{ margin: 0 }}>Sự kiện sắp tới</Title>
                            {!isLecturer && (
                                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal} block={isMobile}>
                                    Thêm Sự kiện mới
                                </Button>
                            )}
                        </div>
                        <Table 
                            dataSource={events} 
                            columns={eventColumns} 
                            rowKey="id" 
                            scroll={{ x: 800 }}
                            size={isMobile ? 'small' : 'middle'}
                        />
                    </>
                );
            case 'students':
                return (
                    <>
                        <div style={{ marginBottom: 16, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 12 }}>
                            <Title level={4} style={{ margin: 0 }}>Danh sách Sinh viên</Title>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateStudentModal} block={isMobile}>
                                Thêm Sinh viên mới
                            </Button>
                        </div>
                        <Table 
                            dataSource={students} 
                            rowKey="id"
                            scroll={{ x: 1000 }}
                            size={isMobile ? 'small' : 'middle'}
                            columns={[
                                { title: 'MSSV', dataIndex: 'username', key: 'username', width: 110 },
                                { title: 'Họ và tên', dataIndex: 'name', key: 'name', width: 180 },
                                { title: 'Mã SV', dataIndex: 'student_code', key: 'student_code', width: 110 },
                                { title: 'Lớp', dataIndex: 'class_name', key: 'class_name', width: 120 },
                                { title: 'Khoa', dataIndex: 'faculty', key: 'faculty', width: 160 },
                                { title: 'Viện', dataIndex: 'institute', key: 'institute', width: 180 },
                                { title: 'Hành động', key: 'action', width: 120, fixed: (isMobile ? 'right' : undefined) as any, render: (record: any) => (
                                    <Space>
                                        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditStudentModal(record)} />
                                        <Popconfirm title="Xóa?" onConfirm={() => handleDeleteStudent(record.id)}>
                                            <Button size="small" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                    </Space>
                                )}
                            ]} 
                        />
                    </>
                );
            case 'logs':
                return (
                    <>
                        <Title level={4} style={{ marginBottom: 16 }}>Lịch sử Hệ thống</Title>
                        <Table 
                            dataSource={logs} 
                            rowKey="id"
                            scroll={{ x: 800 }}
                            size={isMobile ? 'small' : 'middle'}
                            columns={[
                                { title: 'Sinh viên', dataIndex: 'student_name', key: 'student', width: 150 },
                                { title: 'Sự kiện', dataIndex: 'event_name', key: 'event', width: 150 },
                                { title: 'Thời gian', dataIndex: 'checkin_time', key: 'time', width: 130, render: (t) => dayjs(t).format('HH:mm DD/MM') },
                                { title: 'ID Thiết bị', dataIndex: 'device_id', key: 'device', width: 150, render: (d) => <Text copyable ellipsis>{d}</Text> },
                                { title: 'IP', dataIndex: 'ip_address', key: 'ip', width: 120 }
                            ]} 
                        />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <DashboardLayout title="Bảng quản trị">
            {renderContent()}

            <Modal
                title={editingEvent ? 'Sửa sự kiện' : 'Tạo sự kiện mới'}
                open={isEventModalVisible}
                onCancel={() => setIsEventModalVisible(false)}
                footer={null}
                width={isMobile ? '95%' : 1000}
                style={{ top: 20 }}
            >
                <Form form={form} onFinish={handleEventSubmit} layout="vertical">
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={16}>
                            <Form.Item name="name" label="Tên sự kiện" rules={[{ required: true }]}>
                                <Input placeholder="Ví dụ: Lễ tốt nghiệp 2024" size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="priority" label="Mức độ ưu tiên" initialValue={0}>
                                <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                                    <Radio.Button value={0} style={{ flex: 1, textAlign: 'center' }}>Thường</Radio.Button>
                                    <Radio.Button value={1} style={{ flex: 1, textAlign: 'center' }}>GẤP</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="location_name" label="Địa điểm (tên)" initialValue="">
                                <Input placeholder="Ví dụ: Trường Đại học Hàng Hải" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="event_type" label="Loại sự kiện" initialValue="">
                                <Select
                                    options={[
                                        { value: 'Thể thao', label: 'Thể thao' },
                                        { value: 'Lễ', label: 'Lễ' },
                                        { value: 'Học thuật', label: 'Học thuật' },
                                        { value: 'Tình nguyện', label: 'Tình nguyện' },
                                        { value: 'Khác', label: 'Khác' }
                                    ]}
                                    placeholder="Chọn loại sự kiện"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="allowed_faculty" label="Khoa được tham dự" initialValue="">
                                <Select
                                    options={[{ value: '', label: 'Tất cả khoa' }, ...facultyOptions]}
                                    placeholder="Chọn khoa"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="allowed_institute" label="Viện được tham dự" initialValue="">
                                <Select
                                    options={[{ value: '', label: 'Tất cả viện' }, ...instituteOptions]}
                                    placeholder="Chọn viện"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Giấy quyết định (hình ảnh)">
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            {editingEvent?.decision_image_url ? (
                                <a href={editingEvent.decision_image_url} target="_blank" rel="noreferrer">Xem ảnh hiện tại</a>
                            ) : (
                                <Text type="secondary">Chưa có ảnh</Text>
                            )}
                            <Upload
                                accept="image/png,image/jpeg,image/webp"
                                maxCount={1}
                                fileList={
                                    decisionFile
                                        ? [{ uid: '-1', name: decisionFile.name, status: 'done' } as any]
                                        : []
                                }
                                beforeUpload={(file) => {
                                    setDecisionFile(file as any);
                                    return false;
                                }}
                                onRemove={() => {
                                    setDecisionFile(null);
                                }}
                            >
                                <Button icon={<UploadOutlined />} loading={decisionUploading} disabled={decisionUploading}>
                                    Chọn ảnh
                                </Button>
                            </Upload>
                            <Text type="secondary">(Upload sau khi bấm Tạo/Cập nhật; tối đa 5MB)</Text>
                        </Space>
                    </Form.Item>

                    <Form.Item name="content" label="Nội dung sự kiện">
                        <Input.TextArea placeholder="Mô tả chi tiết về sự kiện..." rows={4} />
                    </Form.Item>
                    
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item name="timeRange" label="Thời gian" rules={[{ required: true }]}>
                                <DatePicker.RangePicker showTime style={{ width: '100%' }} format="DD/MM HH:mm" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="qr_type" label="Mã QR" initialValue="dynamic">
                                <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                                    <Radio.Button value="dynamic" style={{ flex: 1, textAlign: 'center' }}>Linh hoạt</Radio.Button>
                                    <Radio.Button value="static" style={{ flex: 1, textAlign: 'center' }}>Cố định</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="is_active" label="Trạng thái kích hoạt" valuePropName="checked" initialValue={true}>
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={[16, 0]}>
                        <Col span={24}>
                            <Form.Item 
                                name="training_points" 
                                label={
                                    <Space size={4}>
                                        Điểm rèn luyện
                                        <Tooltip title="Điểm cộng vào kết quả rèn luyện chính thức của nhà trường.">
                                            <InfoCircleOutlined style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }} />
                                        </Tooltip>
                                    </Space>
                                } 
                                initialValue={0}
                            >
                                <Input type="number" suffix="điểm" />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={16}>
                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.radius !== curr.radius}>
                                {({ getFieldValue }) => (
                                    <Form.Item label="Vị trí điểm danh" name="location" initialValue={{ lat: 10.762622, lng: 106.660172 }}>
                                        <MapPicker radius={getFieldValue('radius') || 50} />
                                    </Form.Item>
                                )}
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Space direction="vertical" style={{ width: '100%', marginTop: 29 }}>
                                <Form.Item name="radius" label="Bán kính" initialValue={50}>
                                    <Input type="number" suffix="m" />
                                </Form.Item>
                                <Form.Item name="max_participants" label="Giới hạn Sinh viên" initialValue={100}>
                                    <Input type="number" />
                                </Form.Item>
                            </Space>
                        </Col>
                    </Row>

                    <Button type="primary" htmlType="submit" block size="large" style={{ marginTop: 8 }} loading={decisionUploading}>
                        {editingEvent ? 'Cập nhật' : 'Tạo sự kiện'}
                    </Button>
                </Form>
            </Modal>

            <Modal
                title={`Mã QR: ${selectedEvent?.name}`}
                open={isQRModalVisible}
                onCancel={() => setIsQRModalVisible(false)}
                footer={null}
                centered
                width={isMobile ? '90%' : 500}
            >
                {selectedEvent && <QRGenerator eventId={selectedEvent.id} eventName={selectedEvent.name} />}
            </Modal>

            <Modal
                title={editingStudent ? 'Sửa sinh viên' : 'Thêm sinh viên'}
                open={isStudentModalVisible}
                onCancel={() => setIsStudentModalVisible(false)}
                footer={null}
            >
                <Form form={studentForm} onFinish={handleStudentSubmit} layout="vertical">
                    <Form.Item name="username" label="MSSV" rules={[{ required: true, message: 'Vui lòng nhập MSSV' }]}>
                        <Input disabled={!!editingStudent} />
                    </Form.Item>
                    <Form.Item name="password" label="Mật khẩu" rules={[{ required: !editingStudent, message: 'Vui lòng nhập mật khẩu' }]}>
                        <Input.Password placeholder={editingStudent ? "Để trống nếu không đổi" : "••••••"} />
                    </Form.Item>
                    <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="student_code" label="Mã sinh viên" rules={[{ required: true, message: 'Vui lòng nhập mã sinh viên' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="class_name" label="Lớp" rules={[{ required: true, message: 'Vui lòng nhập lớp' }]}>
                        <Input placeholder="Ví dụ: K60-CNTT" />
                    </Form.Item>
                    <Form.Item name="faculty" label="Khoa" rules={[{ required: true, message: 'Vui lòng nhập khoa' }]}>
                        <Input placeholder="Ví dụ: Công nghệ thông tin" />
                    </Form.Item>
                    <Form.Item name="institute" label="Viện" rules={[{ required: true, message: 'Vui lòng nhập viện' }]}>
                        <Input placeholder="Ví dụ: Viện đào tạo quốc tế" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">
                        {editingStudent ? 'Cập nhật' : 'Thêm sinh viên'}
                    </Button>
                </Form>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminDashboard;
