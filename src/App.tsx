import { type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EventDetail from './pages/EventDetail';
import ReportsDashboard from './pages/ReportsDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentSettings from './pages/StudentSettings';
import CheckinSuccess from './pages/CheckinSuccess';
import CheckinHandler from './pages/CheckinHandler';

const ProtectedRoute = ({ children, roles }: { children: ReactNode, roles?: Array<'admin' | 'union' | 'student'> }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return <>{children}</>;
};

const AppContent = () => {
    const { user } = useAuth();
    
    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/checkin" element={<CheckinHandler />} />
            <Route 
                path="/admin/*" 
                element={
                    <ProtectedRoute roles={['admin', 'union']}>
                        <Routes>
                            <Route index element={<AdminDashboard />} />
                            <Route path="events/:id" element={<EventDetail />} />
                            <Route path="reports" element={<ReportsDashboard />} />
                        </Routes>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/student/*" 
                element={
                    <ProtectedRoute roles={['student']}>
                        <Routes>
                            <Route index element={<StudentDashboard />} />
                            <Route path="settings" element={<StudentSettings />} />
                            <Route path="success" element={<CheckinSuccess />} />
                        </Routes>
                    </ProtectedRoute>
                } 
            />
            <Route path="/" element={<Navigate to={user?.role === 'student' ? '/student' : '/admin'} />} />
        </Routes>
    );
};

function App() {
    return (
        <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
            <AntdApp>
                <AuthProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </AuthProvider>
            </AntdApp>
        </ConfigProvider>
    );
}

export default App;

