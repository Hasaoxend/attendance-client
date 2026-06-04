import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Typography, Card, Table, Statistic, Row, Col, Space, Tag, 
    DatePicker, Select, Button, Input, message, Tabs, Progress, Empty
} from 'antd';
import { 
    CalendarOutlined, TeamOutlined, CheckCircleOutlined, 
    HistoryOutlined, DownloadOutlined, SearchOutlined,
    BarChartOutlined, TrophyOutlined, FileExcelOutlined,
    ArrowLeftOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReportsDashboard = () => {
    const navigate = useNavigate();
    
    // Overview data (7.1)
    const [overview, setOverview] = useState<any>({});
    const [eventsByMonth, setEventsByMonth] = useState<any[]>([]);
    
    // Registration data (7.2)
    const [registrations, setRegistrations] = useState<any[]>([]);
    
    // Attendance data (7.3)
    const [attendance, setAttendance] = useState<any[]>([]);
    
    // Training points data (7.4)
    const [trainingPoints, setTrainingPoints] = useState<any[]>([]);
    
    // Activity log data (7.5)
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Events list for filters
    const [events, setEvents] = useState<any[]>([]);
    
    // Filters
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
    const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);
    
    // Loading
    const [loading, setLoading] = useState(false);
    
    // Export
    const [exporting, setExporting] = useState(false);

    const getDateParams = useCallback(() => {
        const params: any = {};
        if (dateRange[0]) params.from = dateRange[0].startOf('day').toISOString();
        if (dateRange[1]) params.to = dateRange[1].endOf('day').toISOString();
        return params;
    }, [dateRange]);

    const fetchOverview = useCallback(async () => {
        try {
            const [overviewRes, monthlyRes] = await Promise.all([
                api.get('/reports/overview'),
                api.get('/reports/events-by-month')
            ]);
            setOverview(overviewRes.data);
            setEventsByMonth(monthlyRes.data);
        } catch { /* silent */ }
    }, []);

    const fetchRegistrations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/registrations', { params: getDateParams() });
            setRegistrations(res.data);
        } catch { message.error('Lỗi tải dữ liệu đăng ký'); }
        setLoading(false);
    }, [getDateParams]);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = getDateParams();
            if (selectedEventId) params.eventId = selectedEventId;
            const res = await api.get('/reports/attendance', { params });
            setAttendance(res.data);
        } catch { message.error('Lỗi tải dữ liệu điểm danh'); }
        setLoading(false);
    }, [getDateParams, selectedEventId]);

    const fetchTrainingPoints = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/training-points', { params: getDateParams() });
            setTrainingPoints(res.data);
        } catch { message.error('Lỗi tải dữ liệu ĐRL'); }
        setLoading(false);
    }, [getDateParams]);

    const fetchActivityLog = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { ...getDateParams() };
            if (searchQuery) params.q = searchQuery;
            const res = await api.get('/reports/activity-log', { params });
            setActivityLog(res.data);
        } catch { message.error('Lỗi tải lịch sử hoạt động'); }
        setLoading(false);
    }, [getDateParams, searchQuery]);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchOverview();
        fetchEvents();
    }, [fetchOverview, fetchEvents]);

    const handleExport = async (type: string) => {
        setExporting(true);
        try {
            const params: any = { type, ...getDateParams() };
            if (type === 'attendance' && selectedEventId) params.eventId = selectedEventId;
            
            const res = await api.get('/reports/export/excel', { 
                params,
                responseType: 'blob' 
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = type === 'attendance' ? 'diem_danh.xlsx' 
                : type === 'registrations' ? 'dang_ky_su_kien.xlsx' 
                : 'diem_ren_luyen.xlsx';
            link.setAttribute('download', filename);
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

    // Menu items for sidebar
    const menuItems = [
        { key: '/admin/events', icon: <CalendarOutlined />, label: 'Quản lý Sự kiện', path: '/admin' },
        { key: '/admin/reports', icon: <BarChartOutlined />, label: 'Báo cáo thống kê' },
    ];

    // --- Tab renderers ---

    const renderOverview = () => (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Tổng sự kiện" value={overview.total_events || 0} prefix={<CalendarOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Đang diễn ra" value={overview.ongoing_events || 0} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Sắp tới" value={overview.upcoming_events || 0} valueStyle={{ color: '#1890ff' }} prefix={<CalendarOutlined />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Đã kết thúc" value={overview.past_events || 0} valueStyle={{ color: '#8c8c8c' }} prefix={<HistoryOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic title="Tổng sinh viên" value={overview.total_students || 0} prefix={<TeamOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic title="Tổng lượt điểm danh" value={overview.total_checkins || 0} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic title="Tổng lượt đăng ký" value={overview.total_registrations || 0} prefix={<TeamOutlined />} />
                    </Card>
                </Col>
            </Row>

            {eventsByMonth.length > 0 && (
                <Card title="Số sự kiện theo tháng (12 tháng gần nhất)" size="small">
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, padding: '0 8px' }}>
                        {eventsByMonth.map((item: any) => {
                            const maxCount = Math.max(...eventsByMonth.map((i: any) => Number(i.count)));
                            const height = maxCount > 0 ? (Number(item.count) / maxCount) * 160 : 0;
                            return (
                                <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 11, fontWeight: 600 }}>{item.count}</Text>
                                    <div style={{ 
                                        width: '100%', 
                                        height: Math.max(height, 4), 
                                        background: 'linear-gradient(180deg, #1890ff, #69c0ff)',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.3s'
                                    }} />
                                    <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{item.month.split('-')[1]}/{item.month.split('-')[0].slice(2)}</Text>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );

    const renderRegistrations = () => (
        <div>
            <Space style={{ marginBottom: 16 }} wrap>
                <RangePicker onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])} />
                <Button type="primary" onClick={fetchRegistrations}>Lọc</Button>
            </Space>
            <Table
                loading={loading}
                dataSource={registrations}
                rowKey="id"
                scroll={{ x: 800 }}
                size="small"
                columns={[
                    { title: 'Sự kiện', dataIndex: 'name', key: 'name', width: 200 },
                    { title: 'Loại', dataIndex: 'event_type', key: 'event_type', width: 100, render: (t: string) => t ? <Tag color="purple">{t}</Tag> : '-' },
                    { title: 'Thời gian', key: 'time', width: 160, render: (r: any) => `${dayjs(r.start_time).format('DD/MM HH:mm')} - ${dayjs(r.end_time).format('HH:mm')}` },
                    { title: 'Đã đăng ký', dataIndex: 'registered_count', key: 'registered', width: 100, render: (v: number) => <Tag color="blue">{v}</Tag> },
                    { title: 'Max', dataIndex: 'max_count', key: 'max', width: 80 },
                    { title: 'Tỷ lệ', key: 'rate', width: 120, render: (r: any) => {
                        const pct = r.max_count > 0 ? Math.round((r.registered_count / r.max_count) * 100) : 0;
                        return <Progress percent={pct} size="small" />;
                    }},
                ]}
            />
        </div>
    );

    const renderAttendance = () => (
        <div>
            <Space style={{ marginBottom: 16 }} wrap>
                <Select 
                    style={{ width: 250 }} 
                    placeholder="Chọn sự kiện..." 
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={events.map((e: any) => ({ value: e.id, label: e.name }))}
                    onChange={(v) => setSelectedEventId(v)}
                />
                <RangePicker onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])} />
                <Button type="primary" onClick={fetchAttendance}>Lọc</Button>
            </Space>
            <Table
                loading={loading}
                dataSource={attendance}
                rowKey="id"
                scroll={{ x: 900 }}
                size="small"
                columns={[
                    { title: 'Sự kiện', dataIndex: 'name', key: 'name', width: 200 },
                    { title: 'Loại', dataIndex: 'event_type', key: 'type', width: 100, render: (t: string) => t ? <Tag color="purple">{t}</Tag> : '-' },
                    { title: 'Thời gian', key: 'time', width: 160, render: (r: any) => `${dayjs(r.start_time).format('DD/MM HH:mm')} - ${dayjs(r.end_time).format('HH:mm')}` },
                    { title: 'Đã đăng ký', dataIndex: 'registered_count', key: 'reg', width: 100, render: (v: number) => <Tag>{v}</Tag> },
                    { title: 'Đã điểm danh', dataIndex: 'checked_in_count', key: 'checked', width: 110, render: (v: number) => <Tag color="success" icon={<CheckCircleOutlined />}>{v}</Tag> },
                    { title: 'Vắng', dataIndex: 'absent_count', key: 'absent', width: 80, render: (v: number) => v > 0 ? <Tag color="error" icon={<CloseCircleOutlined />}>{v}</Tag> : <Tag>0</Tag> },
                    { title: 'Tỷ lệ điểm danh', key: 'rate', width: 140, render: (r: any) => {
                        const pct = r.registered_count > 0 ? Math.round((r.checked_in_count / r.registered_count) * 100) : 0;
                        return <Progress percent={pct} size="small" status={pct >= 80 ? 'success' : pct >= 50 ? 'normal' : 'exception'} />;
                    }},
                ]}
            />
        </div>
    );

    const renderTrainingPoints = () => (
        <div>
            <Space style={{ marginBottom: 16 }} wrap>
                <RangePicker onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])} />
                <Button type="primary" onClick={fetchTrainingPoints}>Lọc</Button>
            </Space>
            <Table
                loading={loading}
                dataSource={trainingPoints}
                rowKey="id"
                scroll={{ x: 1000 }}
                size="small"
                columns={[
                    { title: '#', key: 'rank', width: 50, render: (_: any, __: any, idx: number) => {
                        if (idx === 0) return <TrophyOutlined style={{ color: '#ffd700', fontSize: 18 }} />;
                        if (idx === 1) return <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 16 }} />;
                        if (idx === 2) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: 16 }} />;
                        return idx + 1;
                    }},
                    { title: 'MSSV', dataIndex: 'username', key: 'username', width: 110 },
                    { title: 'Họ và tên', dataIndex: 'name', key: 'name', width: 180 },
                    { title: 'Mã SV', dataIndex: 'student_code', key: 'code', width: 110 },
                    { title: 'Lớp', dataIndex: 'class_name', key: 'class', width: 120 },
                    { title: 'Khoa', dataIndex: 'faculty', key: 'faculty', width: 160 },
                    { title: 'Tổng ĐRL', dataIndex: 'total_training_points', key: 'points', width: 100, 
                        render: (v: number) => <Tag color="gold" style={{ fontWeight: 700 }}>+{v}</Tag>,
                        sorter: (a: any, b: any) => a.total_training_points - b.total_training_points,
                        defaultSortOrder: 'descend' as const
                    },
                    { title: 'Số SK', dataIndex: 'events_attended', key: 'events', width: 80 },
                ]}
            />
        </div>
    );

    const renderActivityLog = () => (
        <div>
            <Space style={{ marginBottom: 16 }} wrap>
                <Input.Search
                    placeholder="Tìm theo MSSV, tên, IP, thiết bị..."
                    allowClear
                    style={{ width: 350 }}
                    onSearch={(v) => { setSearchQuery(v); }}
                    enterButton={<SearchOutlined />}
                />
                <RangePicker onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])} />
                <Button type="primary" onClick={fetchActivityLog}>Tìm kiếm</Button>
            </Space>
            {activityLog.length > 0 ? (
                <Table
                    loading={loading}
                    dataSource={activityLog}
                    rowKey="id"
                    scroll={{ x: 1200 }}
                    size="small"
                    pagination={{ pageSize: 20 }}
                    columns={[
                        { title: 'MSSV', dataIndex: 'username', key: 'username', width: 100 },
                        { title: 'Họ tên', dataIndex: 'name', key: 'name', width: 160 },
                        { title: 'Mã SV', dataIndex: 'student_code', key: 'code', width: 100 },
                        { title: 'Sự kiện', dataIndex: 'event_name', key: 'event', width: 180 },
                        { title: 'Thời gian', dataIndex: 'checkin_time', key: 'time', width: 130, render: (t: string) => dayjs(t).format('HH:mm DD/MM/YY') },
                        { title: 'Địa chỉ IP', dataIndex: 'ip_address', key: 'ip', width: 130, render: (ip: string) => <Text copyable style={{ fontSize: 12 }}>{ip || '-'}</Text> },
                        { title: 'ID Thiết bị', dataIndex: 'device_id', key: 'device', width: 180, render: (d: string) => <Text copyable ellipsis style={{ fontSize: 11, maxWidth: 160 }}>{d || '-'}</Text> },
                        { title: 'Tọa độ', key: 'coords', width: 130, render: (r: any) => r.lat && r.lng ? <Text style={{ fontSize: 11 }}>{Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)}</Text> : '-' },
                        { title: 'ĐRL', dataIndex: 'training_points', key: 'tp', width: 70, render: (v: number) => v > 0 ? <Tag color="gold">+{v}</Tag> : '-' },
                    ]}
                />
            ) : (
                <Empty description={<Text type="secondary">Nhập từ khóa tìm kiếm để tra cứu lịch sử hoạt động, IP, thiết bị</Text>} />
            )}
        </div>
    );

    const renderExport = () => (
        <div>
            <Title level={5}>Chọn loại báo cáo cần xuất:</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card hoverable onClick={() => !exporting && handleExport('attendance')} style={{ textAlign: 'center', cursor: exporting ? 'wait' : 'pointer' }}>
                        <FileExcelOutlined style={{ fontSize: 40, color: '#52c41a', marginBottom: 12 }} />
                        <Title level={5}>Báo cáo Điểm danh</Title>
                        <Text type="secondary">Xuất danh sách điểm danh theo sự kiện</Text>
                        {selectedEventId ? (
                            <Tag color="blue" style={{ marginTop: 8 }}>Sự kiện ID: {selectedEventId}</Tag>
                        ) : (
                            <div style={{ marginTop: 8 }}>
                                <Select 
                                    style={{ width: '100%' }} 
                                    placeholder="Chọn sự kiện"
                                    showSearch
                                    optionFilterProp="label"
                                    options={events.map((e: any) => ({ value: e.id, label: e.name }))}
                                    onChange={(v) => setSelectedEventId(v)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card hoverable onClick={() => !exporting && handleExport('registrations')} style={{ textAlign: 'center', cursor: exporting ? 'wait' : 'pointer' }}>
                        <FileExcelOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: 12 }} />
                        <Title level={5}>Báo cáo Đăng ký</Title>
                        <Text type="secondary">Xuất toàn bộ đăng ký sự kiện</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card hoverable onClick={() => !exporting && handleExport('training-points')} style={{ textAlign: 'center', cursor: exporting ? 'wait' : 'pointer' }}>
                        <FileExcelOutlined style={{ fontSize: 40, color: '#faad14', marginBottom: 12 }} />
                        <Title level={5}>Báo cáo Điểm RL</Title>
                        <Text type="secondary">Xuất bảng xếp hạng điểm rèn luyện</Text>
                    </Card>
                </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
                <Space wrap>
                    <Text type="secondary">Khoảng thời gian (tùy chọn):</Text>
                    <RangePicker onChange={(dates) => setDateRange(dates ? [dates[0], dates[1]] : [null, null])} />
                </Space>
            </div>
            {exporting && <Text style={{ marginTop: 12, display: 'block' }}>Đang xuất file Excel...</Text>}
        </div>
    );

    const tabItems = [
        { key: 'overview', label: <span><BarChartOutlined /> 7.1 Thống kê hoạt động</span>, children: renderOverview() },
        { key: 'registrations', label: <span><TeamOutlined /> 7.2 Đăng ký</span>, children: renderRegistrations() },
        { key: 'attendance', label: <span><CheckCircleOutlined /> 7.3 Điểm danh</span>, children: renderAttendance() },
        { key: 'training', label: <span><TrophyOutlined /> 7.4 Điểm RL</span>, children: renderTrainingPoints() },
        { key: 'activity', label: <span><SearchOutlined /> 7.5 Tra cứu</span>, children: renderActivityLog() },
        { key: 'export', label: <span><DownloadOutlined /> 7.6 Xuất Excel</span>, children: renderExport() },
    ];

    return (
        <DashboardLayout title="Báo cáo Thống kê" menuItems={menuItems}>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin')}>Quay lại</Button>
                <Title level={3} style={{ margin: 0 }}>Báo cáo & Thống kê</Title>
            </Space>
            <Tabs 
                items={tabItems} 
                type="card"
                onChange={(key) => {
                    if (key === 'overview') fetchOverview();
                    if (key === 'registrations') fetchRegistrations();
                    if (key === 'attendance') fetchAttendance();
                    if (key === 'training') fetchTrainingPoints();
                }}
            />
        </DashboardLayout>
    );
};

export default ReportsDashboard;
