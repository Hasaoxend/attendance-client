import { useState, useEffect, useCallback } from 'react';
import { 
    Typography, 
    Card, 
    Tag, 
    message, 
    Button, 
    Space, 
    Skeleton, 
    Empty, 
    Modal, 
    Row, 
    Col, 
    Statistic,
    Tooltip,
    Grid,
    DatePicker,
    Segmented
} from 'antd';
import { 
    EnvironmentOutlined, 
    HistoryOutlined, 
    ScanOutlined, 
    StarFilled,
    ClockCircleOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    UserOutlined,
    CalendarOutlined,
    SettingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import api from '../api/axios';
import QRScanner from '../components/QRScanner';
import DashboardLayout from '../components/DashboardLayout';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const StudentDashboard = () => {
    const [events, setEvents] = useState([]);
    const [history, setHistory] = useState([]);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('events');
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'month' | 'year'>('month');
    const [filterDate, setFilterDate] = useState<dayjs.Dayjs>(dayjs());
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const defaultLimit = 3;
    const [ongoingLimit, setOngoingLimit] = useState(defaultLimit);
    const [registeringId, setRegisteringId] = useState<number | null>(null);

    // Unified Light Theme for both mobile and desktop (Purple removed per user request)
    const T = {
        textPrimary: '#000',
        textSecondary: 'rgba(0,0,0,0.55)',
        textMuted: 'rgba(0,0,0,0.35)',
        cardBg: '#fff',
        cardBorder: '1px solid #f0f0f0',
        btnBg: '#1890ff', // Standard Ant Design primary color
        btnColor: '#fff',
        sectionBg: '#fafafa',
        sectionBorder: '1px solid #f0f0f0',
        headerBg: 'linear-gradient(90deg, #f5f5f5 0%, #fafafa 100%)',
        emptyText: 'rgba(0,0,0,0.45)',
    };

    const fetchEvents = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (error) {
            console.error(error);
            if (localStorage.getItem('token')) {
                message.error('Không thể tải danh sách sự kiện');
            }
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await api.get('/history/student');
            setHistory(res.data);
        } catch (error) {
            console.error(error);
            if (localStorage.getItem('token')) {
                message.error('Không thể tải lịch sử điểm danh');
            }
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchEvents(), fetchHistory()]);
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => message.warning('Vui lòng bật GPS để có thể điểm danh.')
                );
            }
            setLoading(false);
        }
        init();
    }, [fetchEvents, fetchHistory]);


    // Event Logic - Ongoing (Active & Currently matching time)
    const ongoingEvents = events
        .filter((e: any) => e.is_active && dayjs().isBetween(dayjs(e.start_time), dayjs(e.end_time)))
        .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0) || dayjs(b.start_time).unix() - dayjs(a.start_time).unix());

    // Upcoming events (Active & start_time in the future)
    const upcomingEvents = events
        .filter((e: any) => e.is_active && dayjs().isBefore(dayjs(e.start_time)))
        .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0) || dayjs(a.start_time).unix() - dayjs(b.start_time).unix());

    const monthlyPoints = history
        .filter((h: any) => dayjs(h.checkin_time).isSameOrAfter(dayjs().startOf('month')))
        .reduce((sum: number, h: any) => sum + Number(h.training_points || 0), 0);

    const EventCard = ({ event, ongoing }: { event: any, ongoing: boolean }) => (
        <Card 
            className={(isMobile && ongoing && event.priority === 1) ? 'pulse-animation' : ''}
            styles={{ body: { padding: 20 } }}
            style={{ 
                height: '100%', 
                background: T.cardBg, 
                border: T.cardBorder,
                borderRadius: 16,
                boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0,0,0,0.06)'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            {ongoing && event.priority === 1 && <Tag color="error" style={{ margin: 0, fontWeight: 'bold' }}>GẤP</Tag>}
                            <Title level={4} style={{ margin: 0, color: T.textPrimary, fontSize: isMobile ? 16 : 20 }}>{event.name}</Title>
                        </div>
                        <Space wrap style={{ marginTop: 4 }}>
                            {event.training_points > 0 && (
                                <Tag color="green" style={{ borderRadius: 12 }}>+{event.training_points} ĐRL</Tag>
                            )}
                        </Space>
                    </div>
                    <Button 
                        type="text" 
                        icon={<InfoCircleOutlined style={{ color: T.textSecondary, fontSize: 20 }} />} 
                        onClick={() => setSelectedEvent(event)}
                    />
                </div>
                
                <div style={{ flex: 1 }}>
                    <Space direction="vertical" size={2}>
                        <Text style={{ color: T.textSecondary, fontSize: isMobile ? 13 : 14 }}>
                            <EnvironmentOutlined /> {event.location_name || 'Hội trường chính'}
                        </Text>
                        <Text style={{ color: T.textSecondary, fontSize: isMobile ? 13 : 14 }}>
                            <ClockCircleOutlined /> {dayjs(event.start_time).format('DD/MM HH:mm')} - {dayjs(event.end_time).format('HH:mm')}
                        </Text>
                        <Text style={{ color: T.textMuted, fontSize: 12 }}>
                            <UserOutlined /> {Number(event.registered_count || 0)}/{event.max_participants} đã đăng ký
                        </Text>
                    </Space>
                </div>

                {ongoing ? (
                    event.is_registered ? (
                        <Button 
                            type="primary" 
                            block 
                            size="large"
                            icon={<ScanOutlined />}
                            onClick={() => setIsScannerOpen(true)}
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
                            ĐIỂM DANH NGAY
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            block
                            size="large"
                            loading={registeringId === event.id}
                            onClick={async () => {
                                setRegisteringId(event.id);
                                try {
                                    await api.post(`/events/${event.id}/register`);
                                    message.success('Đăng ký sự kiện thành công');
                                    await fetchEvents();
                                } catch (err: any) {
                                    message.error(err.response?.data?.message || 'Đăng ký thất bại');
                                } finally {
                                    setRegisteringId(null);
                                }
                            }}
                            style={{ height: 45, borderRadius: 8, marginTop: 10, fontWeight: 600 }}
                        >
                            ĐĂNG KÝ ĐỂ ĐIỂM DANH
                        </Button>
                    )
                ) : (
                    <Button
                        block
                        size="large"
                        loading={registeringId === event.id}
                        onClick={async () => {
                            setRegisteringId(event.id);
                            try {
                                if (event.is_registered) {
                                    await api.delete(`/events/${event.id}/register`);
                                    message.success('Hủy đăng ký thành công');
                                } else {
                                    await api.post(`/events/${event.id}/register`);
                                    message.success('Đăng ký sự kiện thành công');
                                }
                                await fetchEvents();
                            } catch (err: any) {
                                message.error(err.response?.data?.message || 'Thao tác thất bại');
                            } finally {
                                setRegisteringId(null);
                            }
                        }}
                        style={{ height: 45, borderRadius: 8, marginTop: 10, fontWeight: 600 }}
                    >
                        {event.is_registered ? 'HỦY ĐĂNG KÝ' : 'ĐĂNG KÝ THAM GIA'}
                    </Button>
                )}
            </div>
        </Card>
    );

    const renderEvents = () => (
        <div style={{ width: '100%', paddingBottom: 100 }}>
            {monthlyPoints > 0 && (
                <Card 
                    styles={{ body: { padding: '12px 16px' } }} 
                    style={{ marginBottom: 20, border: '1px solid #ffd700', background: T.cardBg }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <div style={{ background: 'rgba(255,215,0,0.2)', padding: 8, borderRadius: 10 }}>
                                <StarFilled style={{ color: '#ffd700' }} />
                            </div>
                            <div>
                                <Text style={{ color: T.textSecondary, fontSize: 12, display: 'block' }}>TỔNG ĐRL THÁNG {dayjs().format('MM')}</Text>
                                <Text strong style={{ color: T.textPrimary, fontSize: 18 }}>{monthlyPoints} Điểm</Text>
                            </div>
                        </Space>
                        <Tag color="gold" style={{ borderRadius: 10, margin: 0 }}>Hạng A</Tag>
                    </div>
                </Card>
            )}

            {/* ONGOING EVENTS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ color: T.textPrimary, margin: 0 }}>Sự kiện đang diễn ra</Title>
                <Tag color="cyan" style={{ borderRadius: 10 }}>{ongoingEvents.length} sự kiện</Tag>
            </div>

            {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
            ) : ongoingEvents.length > 0 ? (
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                        {ongoingEvents.slice(0, ongoingLimit).map((event: any) => (
                            <Col xs={24} sm={12} lg={8} key={event.id}>
                                <EventCard event={event} ongoing={true} />
                            </Col>
                        ))}
                    </Row>
                    {ongoingEvents.length > defaultLimit && (
                        <div style={{ textAlign: 'center', marginBottom: 30 }}>
                            <Space>
                                {ongoingEvents.length > ongoingLimit && (
                                    <Button onClick={() => setOngoingLimit(prev => prev + 6)}>XEM THÊM</Button>
                                )}
                                {ongoingLimit > defaultLimit && (
                                    <Button onClick={() => setOngoingLimit(defaultLimit)}>THU GỌN</Button>
                                )}
                            </Space>
                        </div>
                    )}
                </>
            ) : (
                <Empty 
                    description={<Text style={{ color: T.emptyText }}>Không có sự kiện nào đang diễn ra ngay lúc này.</Text>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ marginBottom: 30 }}
                />
            )}

            {/* UPCOMING EVENTS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 24 }}>
                <Title level={4} style={{ color: T.textPrimary, margin: 0 }}>Sự kiện sắp tới</Title>
                <Tag color="geekblue" style={{ borderRadius: 10 }}>{upcomingEvents.length} sự kiện</Tag>
            </div>

            {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
            ) : upcomingEvents.length > 0 ? (
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    {upcomingEvents.slice(0, 6).map((event: any) => (
                        <Col xs={24} sm={12} lg={8} key={event.id}>
                            <EventCard event={event} ongoing={false} />
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty 
                    description={<Text style={{ color: T.emptyText }}>Chưa có sự kiện sắp tới.</Text>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ marginBottom: 30 }}
                />
            )}

            <Card 
                title={<span style={{ color: T.textPrimary }}>Trạng thái thiết bị</span>} 
                style={{ marginTop: 30, background: T.cardBg, border: T.cardBorder, borderRadius: 16 }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: T.textSecondary }}>GPS:</Text>
                        {location ? <Tag color="success">Sẵn sàng</Tag> : <Tag color="error">Cần bật vị trí</Tag>}
                    </div>
                </Space>
            </Card>
        </div>
    );

    const renderHistory = () => {
        const filteredHistory = history.filter((item: any) => {
            const itemDate = dayjs(item.checkin_time);
            if (filterType === 'month') {
                return itemDate.isSame(filterDate, 'month');
            } else {
                return itemDate.isSame(filterDate, 'year');
            }
        });

        const groupedHistory = filteredHistory.reduce((acc: any, item: any) => {
            const month = dayjs(item.checkin_time).format('MM/YYYY');
            if (!acc[month]) acc[month] = { items: [], total: 0 };
            acc[month].items.push(item);
            acc[month].total += Number(item.training_points || 0);
            return acc;
        }, {});

        const months = Object.keys(groupedHistory).sort((a, b) => {
            const dateA = dayjs(a, 'MM/YYYY');
            const dateB = dayjs(b, 'MM/YYYY');
            return dateB.diff(dateA);
        });

        const periodTotal = filteredHistory.reduce((sum: number, item: any) => sum + Number(item.training_points || 0), 0);

        return (
            <div style={{ width: '100%', paddingBottom: 100 }}>
                <div style={{ 
                    background: T.sectionBg, 
                    padding: '20px', 
                    borderRadius: '16px', 
                    marginBottom: 24,
                    border: T.sectionBorder
                }}>
                    <Title level={4} style={{ color: T.textPrimary, marginBottom: 16 }}>Lọc lịch sử</Title>
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                        <Segmented
                            block
                            options={[
                                { label: 'Theo Tháng', value: 'month' },
                                { label: 'Theo Năm', value: 'year' }
                            ]}
                            value={filterType}
                            onChange={(v: any) => setFilterType(v)}
                        />
                        <div style={{ display: 'flex', gap: 12 }}>
                            <DatePicker 
                                picker={filterType} 
                                value={filterDate}
                                onChange={(date) => date && setFilterDate(date)}
                                style={{ flex: 1 }}
                                format={filterType === 'month' ? 'MM/YYYY' : 'YYYY'}
                                allowClear={false}
                            />
                            <Card size="small" style={{ background: '#fffbe6', border: '1px solid #ffe58f', minWidth: 100 }}>
                                <Statistic 
                                    title={<Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.6)' }}>TỔNG {filterType === 'month' ? 'THÁNG' : 'NĂM'}</Text>}
                                    value={periodTotal} 
                                    suffix="ĐRL"
                                    valueStyle={{ fontSize: 16, fontWeight: 700, color: '#d48806' }}
                                />
                            </Card>
                        </div>
                    </Space>
                </div>

                {months.length > 0 ? (
                    months.map(month => (
                        <div key={month} style={{ marginBottom: 30 }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                background: T.headerBg,
                                padding: '14px 20px',
                                borderRadius: '12px 12px 0 0',
                                borderBottom: T.sectionBorder
                            }}>
                                <Space>
                                    <CalendarOutlined style={{ color: '#faad14' }} />
                                    <Text strong style={{ color: T.textPrimary, fontSize: 14 }}>Tháng {month}</Text>
                                </Space>
                                <Tag color="gold" style={{ color: '#d48806', fontWeight: 700, border: 'none', borderRadius: 12, padding: '2px 12px', margin: 0 }}>
                                    +{groupedHistory[month].total} ĐRL
                                </Tag>
                            </div>
                            <div style={{ 
                                background: T.sectionBg, 
                                padding: '16px', 
                                borderRadius: '0 0 12px 12px',
                                border: T.sectionBorder,
                                borderTop: 'none'
                            }}>
                                {groupedHistory[month].items.map((item: any) => (
                                    <div key={item.id} style={{ 
                                        padding: '12px 0', 
                                        borderBottom: '1px solid #f0f0f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <Text strong style={{ color: T.textPrimary, fontSize: 14, display: 'block' }}>{item.event_name}</Text>
                                            <Space wrap>
                                                <Text style={{ color: T.textSecondary, fontSize: 12 }}>
                                                    {dayjs(item.checkin_time).format('DD/MM/YYYY HH:mm')}
                                                </Text>
                                                <Tag color="gold" style={{ fontSize: 10, borderRadius: 10 }}>
                                                    +{item.training_points} ĐRL
                                                </Tag>
                                            </Space>
                                        </div>
                                        <Tag color="success" style={{ borderRadius: 10, fontSize: 10, margin: 0 }}>Hoàn thành</Tag>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <Empty description={<Text style={{ color: T.emptyText }}>Không có hoạt động nào trong thời gian này</Text>} />
                )}
            </div>
        );
    };

    const menuItems = [
        { key: '/student', label: 'Sự kiện', icon: <HomeOutlined />, onClick: () => setActiveTab('events') },
        { key: '/student/history', label: 'Lịch sử điểm danh', icon: <HistoryOutlined />, onClick: () => setActiveTab('history') },
        { key: '/student/settings', label: 'Cài đặt hồ sơ', icon: <SettingOutlined />, path: '/student/settings' }
    ];

    return (
        <DashboardLayout 
            title={activeTab === 'events' ? 'Sự kiện sinh viên' : 'Lịch sử điểm danh'}
            menuItems={menuItems}
            contentStyle={{ padding: isMobile ? 12 : 24, background: '#f5f5f5', border: 'none' }}
        >
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {activeTab === 'events' ? renderEvents() : renderHistory()}
            </div>

            <Modal
                title={selectedEvent?.name}
                open={!!selectedEvent}
                onCancel={() => setSelectedEvent(null)}
                footer={null}
                centered
            >
                {selectedEvent && (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <div>
                            <Text strong style={{ color: 'rgba(0,0,0,0.65)' }}>Nội dung sự kiện:</Text>
                            <div style={{ marginTop: 8, padding: 16, background: '#f5f5f5', borderRadius: 8, fontSize: 14 }}>
                                {selectedEvent.content || 'Sự kiện chưa có mô tả chi tiết.'}
                            </div>
                        </div>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Statistic 
                                    title={
                                        <Space>
                                            Điểm rèn luyện
                                            <Tooltip title="Điểm cộng vào kết quả rèn luyện chính thức của nhà trường.">
                                                <InfoCircleOutlined style={{ fontSize: 12 }} />
                                            </Tooltip>
                                        </Space>
                                    } 
                                    value={`+${selectedEvent.training_points || 0}`} 
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic title="Thời gian" value={dayjs(selectedEvent.start_time).format('DD/MM HH:mm')} suffix={` - ${dayjs(selectedEvent.end_time).format('HH:mm')}`} valueStyle={{ fontSize: 14 }} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="Đăng ký" value={Number(selectedEvent.registered_count || 0)} suffix={`/ ${selectedEvent.max_participants}`} valueStyle={{ fontSize: 14 }} />
                            </Col>
                        </Row>

                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            <Button
                                type={selectedEvent.is_registered ? 'default' : 'primary'}
                                danger={selectedEvent.is_registered}
                                loading={registeringId === selectedEvent.id}
                                onClick={async () => {
                                    setRegisteringId(selectedEvent.id);
                                    try {
                                        if (selectedEvent.is_registered) {
                                            await api.delete(`/events/${selectedEvent.id}/register`);
                                            setSelectedEvent((prev: any) => prev ? ({
                                                ...prev,
                                                is_registered: false,
                                                registered_count: Math.max(0, Number(prev.registered_count || 0) - 1)
                                            }) : prev);
                                            message.success('Hủy đăng ký thành công');
                                        } else {
                                            await api.post(`/events/${selectedEvent.id}/register`);
                                            setSelectedEvent((prev: any) => prev ? ({
                                                ...prev,
                                                is_registered: true,
                                                registered_count: Number(prev.registered_count || 0) + 1
                                            }) : prev);
                                            message.success('Đăng ký sự kiện thành công');
                                        }
                                        await fetchEvents();
                                    } catch (err: any) {
                                        message.error(err.response?.data?.message || 'Thao tác thất bại');
                                    } finally {
                                        setRegisteringId(null);
                                    }
                                }}
                                block
                            >
                                {selectedEvent.is_registered ? 'HỦY ĐĂNG KÝ' : 'ĐĂNG KÝ THAM GIA'}
                            </Button>

                            {selectedEvent.is_registered && dayjs().isBetween(dayjs(selectedEvent.start_time), dayjs(selectedEvent.end_time)) && (
                                <Button
                                    type="primary"
                                    icon={<ScanOutlined />}
                                    onClick={() => {
                                        setSelectedEvent(null);
                                        setIsScannerOpen(true);
                                    }}
                                    block
                                >
                                    MỞ QUÉT QR ĐIỂM DANH
                                </Button>
                            )}
                        </Space>
                    </Space>
                )}
            </Modal>

            <Modal
                title="Quét mã QR điểm danh"
                open={isScannerOpen}
                onCancel={() => setIsScannerOpen(false)}
                footer={null}
                centered
                destroyOnClose
                width={isScannerOpen ? '100%' : 500}
                styles={{ 
                    body: { padding: 12, background: '#000' },
                    header: { background: '#000', borderBottom: '1px solid rgba(255,255,255,0.1)' }
                }}
            >
                <QRScanner 
                    location={location} 
                    onSuccess={() => {
                        setIsScannerOpen(false);
                        fetchHistory();
                    }} 
                />
            </Modal>
        </DashboardLayout>
    );
};

export default StudentDashboard;
