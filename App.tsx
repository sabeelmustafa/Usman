
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, Role } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import StudentProfile from './components/StudentProfile';
import Fees from './components/Fees';
import Staff from './components/Staff';
import EmployeeProfile from './components/EmployeeProfile';
import Courses from './components/Classes'; // File re-used as courses
import Settings from './components/Settings';
import AuditLogs from './components/AuditLogs';
import Attendance from './components/Attendance';
import Users from './components/Users';
import Layout from './components/Layout';
import PrintView from './components/PrintView';
import { AuthContext } from './AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user } = React.useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = user.role === 'Admin' ? '/dashboard' : '/my-profile';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
};

const SESSION_KEY = 'schoolflow_therapy_session';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
        let storedUser = localStorage.getItem(SESSION_KEY);
        if (!storedUser) {
            storedUser = sessionStorage.getItem(SESSION_KEY);
        }
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
    } catch (e) {
        console.error("Failed to parse session", e);
    } finally {
        setTimeout(() => setLoading(false), 500); 
    }
  }, []);

  const login = (userData: User, remember: boolean) => {
    setUser(userData);
    if (remember) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    }
  };
  
  const updateUser = (userData: User) => {
    setUser(userData);
    if (localStorage.getItem(SESSION_KEY)) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const getDefaultRoute = () => {
    if (user?.role === 'Admin') return '/dashboard';
    return '/my-profile';
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-500 gap-3">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <span className="font-medium text-lg">Loading Therapy System...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/print/:type/:id" element={<PrintView />} />
          
          <Route path="/" element={<ProtectedRoute allowedRoles={['Admin', 'Teacher', 'Staff', 'Accountant']}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to={getDefaultRoute()} replace />} />
            
            <Route path="dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="my-profile" element={<ProtectedRoute allowedRoles={['Staff', 'Teacher', 'Admin', 'Accountant']}><EmployeeProfile /></ProtectedRoute>} />
            <Route path="students" element={<ProtectedRoute allowedRoles={['Admin', 'Teacher', 'Accountant']}><Students /></ProtectedRoute>} />
            <Route path="students/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Teacher', 'Accountant']}><StudentProfile /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute allowedRoles={['Admin', 'Teacher', 'Staff']}><Attendance /></ProtectedRoute>} />
            
            <Route path="users" element={<ProtectedRoute allowedRoles={['Admin']}><Users /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute allowedRoles={['Admin']}><Settings /></ProtectedRoute>} />
            <Route path="classes" element={<ProtectedRoute allowedRoles={['Admin']}><Courses /></ProtectedRoute>} />
            <Route path="logs" element={<ProtectedRoute allowedRoles={['Admin']}><AuditLogs /></ProtectedRoute>} />
            
            <Route path="fees" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><Fees /></ProtectedRoute>} />
            <Route path="staff" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><Staff /></ProtectedRoute>} />
            <Route path="staff/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><EmployeeProfile /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
