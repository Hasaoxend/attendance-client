import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography, Card, Table, Tag, Button, Space, Input, Select, Modal,
    Form, message, Tabs, Row, Col, Popconfirm, Badge
} from 'antd';
import {
    UserOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
    SearchOutlined, ArrowLeftOutlined, SafetyCertificateOutlined,
    LockOutlined, KeyOutlined,
    CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const { Title, Text } = Typography;

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    admin: { label: 'Quản trị viên', color: 'red' },
    union: { label: 'Cán bộ Đoàn', color: 'blue' },
    lecturer: { label: 'Giảng viên', color: 'purple' },
    student: { label: 'Sinh viên', color: 'green' },
};

const AccountManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [form] = Form.useForm();
    const [filterRole, setFilterRole] = useState<string | undefined>(undefined);
    const [searchText, setSearchText] = useState('');
    const [rolesData, setRolesData] = useState<any>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterRole) params.role = filterRole;
            const res = await api.get('/users', { params });
            setUsers(res.data);
        } catch { message.error('Lỗi tải danh sách tài khoản'); }
        setLoading(false);
    }, [filterRole]);

    const fetchRoles = useCallback(async () => {
        try {
            const res = await api.get('/users/roles');
            setRolesData(res.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const handleSave = async (values: any) => {
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, values);
                message.success('Cập nhật tài khoản thành công!');
            } else {
                await api.post('/users', values);
                message.success('Tạo tài khoản thành công!');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingUser(null);
            fetchUsers();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/users/${id}`);
            message.success('Xóa tài khoản thành công!');
            fetchUsers();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        form.setFieldsValue({
            username: user.username,
            name: user.name,
            role: user.role,
            student_code: user.student_code,
            class_name: user.class_name,
            faculty: user.faculty,
            institute: user.institute,
            position: user.position,
        });
        setModalVisible(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ role: 'student' });
        setModalVisible(true);
    };

    const filteredUsers = users.filter(u => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return (
            u.username?.toLowerCase().includes(q) ||
            u.name?.toLowerCase().includes(q) ||
            u.student_code?.toLowerCase().includes(q) ||
            u.position?.toLowerCase().includes(q)
        );
    });

    const roleCounts = {
        admin: users.filter(u => u.role === 'admin').length,
        union: users.filter(u => u.role === 'union').length,
        lecturer: users.filter(u => u.role === 'lecturer').length,
        student: users.filter(u => u.role === 'student').length,
    };

    // ─── Tab 1: Account List ─────────────────────────
    const columns = [
        { title: 'Username', dataIndex: 'username', key: 'username', width: 120 },
        { title: 'Họ và tên', dataIndex: 'name', key: 'name', width: 180 },
        {
            title: 'Vai trò', dataIndex: 'role', key: 'role', width: 130,
            render: (role: string) => {
                const cfg = ROLE_CONFIG[role] || { label: role, color: 'default' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
            filters: Object.entries(ROLE_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
            onFilter: (value: any, record: any) => record.role === value,
        },
        { title: 'Chức vụ', dataIndex: 'position', key: 'position', width: 150,
            render: (p: string) => p || <Text type="secondary">—</Text>
        },
        { title: 'Mã SV', dataIndex: 'student_code', key: 'student_code', width: 100 },
        { title: 'Lớp', dataIndex: 'class_name', key: 'class_name', width: 100 },
        { title: 'Khoa', dataIndex: 'faculty', key: 'faculty', width: 150 },
        { title: 'Viện', dataIndex: 'institute', key: 'institute', width: 160 },
        {
            title: 'Thao tác', key: 'actions', width: 140, fixed: 'right' as const,
            render: (_: any, record: any) => (
                <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>Sửa</Button>
                    <Popconfirm title="Xác nhận xóa tài khoản này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const renderAccountList = () => (
        <div>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                    <Col xs={12} sm={6} key={key}>
                        <Card
                            size="small"
                            hoverable
                            onClick={() => setFilterRole(filterRole === key ? undefined : key)}
                            style={{
                                borderColor: filterRole === key ? cfg.color : undefined,
                                borderWidth: filterRole === key ? 2 : 1,
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <Badge count={roleCounts[key as keyof typeof roleCounts]} showZero color={cfg.color} />
                                <div style={{ marginTop: 4, fontSize: 12 }}>{cfg.label}</div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Space style={{ marginBottom: 16 }} wrap>
                <Input.Search
                    placeholder="Tìm theo username, tên, mã SV, chức vụ..."
                    allowClear
                    style={{ width: 350 }}
                    onSearch={setSearchText}
                    enterButton={<SearchOutlined />}
                />
                <Select
                    style={{ width: 180 }}
                    placeholder="Lọc theo vai trò"
                    allowClear
                    value={filterRole}
                    onChange={setFilterRole}
                    options={[
                        ...Object.entries(ROLE_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
                    ]}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Thêm tài khoản
                </Button>
            </Space>

            <Table
                loading={loading}
                dataSource={filteredUsers}
                columns={columns}
                rowKey="id"
                scroll={{ x: 1200 }}
                pagination={{ pageSize: 15, showSizeChanger: true }}
                size="small"
            />
        </div>
    );

    // ─── Tab 2: Permission Matrix ─────────────────────────
    const renderPermissions = () => {
        if (!rolesData) return <Text>Đang tải...</Text>;

        const { roles, permissionLabels } = rolesData;
        const allPermissions = Object.keys(permissionLabels);
        const roleKeys = Object.keys(roles);

        const permissionGroups: Record<string, string[]> = {
            'Sự kiện': allPermissions.filter(p => p.startsWith('event.')),
            'Sinh viên': allPermissions.filter(p => p.startsWith('student.')),
            'Tài khoản': allPermissions.filter(p => p.startsWith('account.')),
            'Báo cáo': allPermissions.filter(p => p.startsWith('report.')),
            'Điểm danh': allPermissions.filter(p => p.startsWith('checkin.')),
        };

        return (
            <div>
                <Title level={5} style={{ marginBottom: 16 }}>
                    <KeyOutlined /> Ma trận phân quyền theo vai trò
                </Title>

                <Table
                    dataSource={allPermissions.map(p => ({ key: p, permission: p }))}
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ x: 800 }}
                    columns={[
                        {
                            title: 'Nhóm', key: 'group', width: 120,
                            render: (_: any, record: any) => {
                                const group = Object.entries(permissionGroups).find(([, perms]) => perms.includes(record.permission));
                                return group ? <Tag>{group[0]}</Tag> : '—';
                            },
                        },
                        {
                            title: 'Quyền hạn', key: 'label', width: 200,
                            render: (_: any, record: any) => (
                                <Text strong>{permissionLabels[record.permission]}</Text>
                            ),
                        },
                        ...roleKeys.map(roleKey => ({
                            title: (
                                <Tag color={roles[roleKey].color} style={{ margin: 0 }}>
                                    {roles[roleKey].label}
                                </Tag>
                            ),
                            key: roleKey,
                            width: 140,
                            align: 'center' as const,
                            render: (_: any, record: any) => {
                                const has = roles[roleKey].permissions.includes(record.permission);
                                return has
                                    ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                                    : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />;
                            },
                        })),
                    ]}
                />

                <Card style={{ marginTop: 24 }} size="small">
                    <Title level={5}>Mô tả vai trò</Title>
                    <Row gutter={[16, 16]}>
                        {roleKeys.map(roleKey => (
                            <Col xs={24} sm={12} md={6} key={roleKey}>
                                <Card
                                    size="small"
                                    title={<Tag color={roles[roleKey].color}>{roles[roleKey].label}</Tag>}
                                >
                                    <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                                        {roles[roleKey].permissions.map((p: string) => (
                                            <li key={p}>{permissionLabels[p] || p}</li>
                                        ))}
                                    </ul>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>
            </div>
        );
    };

    // ─── Tab 3: Quick Role Assignment ─────────────────────────
    const renderRoleAssignment = () => (
        <div>
            <Title level={5} style={{ marginBottom: 16 }}>
                <SafetyCertificateOutlined /> Gán vai trò nhanh
            </Title>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                Bấm "Sửa" ở bảng bên dưới để thay đổi vai trò và chức vụ cho tài khoản.
            </Text>

            <Table
                loading={loading}
                dataSource={users}
                rowKey="id"
                size="small"
                scroll={{ x: 900 }}
                pagination={{ pageSize: 20 }}
                columns={[
                    { title: 'Username', dataIndex: 'username', key: 'username', width: 120 },
                    { title: 'Họ và tên', dataIndex: 'name', key: 'name', width: 180 },
                    {
                        title: 'Vai trò hiện tại', dataIndex: 'role', key: 'role', width: 140,
                        render: (role: string) => {
                            const cfg = ROLE_CONFIG[role] || { label: role, color: 'default' };
                            return <Tag color={cfg.color}>{cfg.label}</Tag>;
                        },
                    },
                    {
                        title: 'Chức vụ', dataIndex: 'position', key: 'position', width: 150,
                        render: (p: string) => p || <Text type="secondary">—</Text>,
                    },
                    { title: 'Khoa', dataIndex: 'faculty', key: 'faculty', width: 150 },
                    {
                        title: 'Thao tác', key: 'actions', width: 100,
                        render: (_: any, record: any) => (
                            <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => openEditModal(record)}>
                                Sửa
                            </Button>
                        ),
                    },
                ]}
            />
        </div>
    );


    const tabItems = [
        { key: 'accounts', label: <span><UserOutlined /> Danh sách Tài khoản</span>, children: renderAccountList() },
        { key: 'permissions', label: <span><LockOutlined /> Phân quyền</span>, children: renderPermissions() },
        { key: 'roles', label: <span><SafetyCertificateOutlined /> Gán vai trò</span>, children: renderRoleAssignment() },
    ];

    return (
        <DashboardLayout title="Quản lý Tài khoản & Phân quyền">
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin')}>Quay lại</Button>
                <Title level={3} style={{ margin: 0 }}>Quản lý Tài khoản & Phân quyền</Title>
            </Space>

            <Tabs items={tabItems} type="card" />

            {/* Create/Edit Modal */}
            <Modal
                title={editingUser ? `Sửa tài khoản: ${editingUser.username}` : 'Tạo tài khoản mới'}
                open={modalVisible}
                onCancel={() => { setModalVisible(false); setEditingUser(null); form.resetFields(); }}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="username" label="Username / MSSV" rules={[{ required: true, message: 'Bắt buộc' }]}>
                                <Input prefix={<UserOutlined />} disabled={!!editingUser} placeholder="vd: gv01 hoặc SV001" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="password"
                                label={editingUser ? 'Mật khẩu mới (để trống = giữ cũ)' : 'Mật khẩu'}
                                rules={editingUser ? [] : [{ required: true, message: 'Bắt buộc' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Bắt buộc' }]}>
                                <Input placeholder="Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
                                <Select
                                    options={Object.entries(ROLE_CONFIG).map(([k, v]) => ({
                                        value: k,
                                        label: <Tag color={v.color}>{v.label}</Tag>,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="position" label="Chức vụ">
                                <Input placeholder="vd: Giảng viên CNTT, Bí thư Đoàn, Trưởng khoa..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="student_code" label="Mã sinh viên">
                                <Input placeholder="SV001 (chỉ cho sinh viên)" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="class_name" label="Lớp">
                                <Input placeholder="K60-CNTT" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="faculty" label="Khoa">
                                <Input placeholder="Công nghệ thông tin" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="institute" label="Viện">
                                <Input placeholder="Viện ĐTQT" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setModalVisible(false); setEditingUser(null); }}>Hủy</Button>
                            <Button type="primary" htmlType="submit" icon={editingUser ? <EditOutlined /> : <PlusOutlined />}>
                                {editingUser ? 'Cập nhật' : 'Tạo tài khoản'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </DashboardLayout>
    );
};

export default AccountManagement;
