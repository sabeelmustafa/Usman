
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

// Default Admin User for seamless access
const DEFAULT_ADMIN: User = { 
  id: 'u-1', 
  username: 'admin', 
  role: 'Admin', 
  name: 'Super Admin' 
};

// Simplified Protected Route Component (Bypassing auth)
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user } = React.useContext(AuthContext);
  
  // Auth is disabled: directly returning children.
  // In a real app, you'd check if user exists, but here we default to Super Admin.
  return <>{children}</>;
};

const SESSION_KEY = 'schoolflow_therapy_session';

const App: React.FC = () => {
  // Initializing with DEFAULT_ADMIN to remove login screen
  const [user, setUser] = useState<User | null>(DEFAULT_ADMIN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load existing session if it exists, otherwise use default
    try {
        let storedUser = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
    } catch (e) {
        console.error("Failed to parse session", e);
    } finally {
        setTimeout(() => setLoading(false), 300);
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
    // Refresh to reset to DEFAULT_ADMIN state for this "no-login" version
    window.location.reload();
  };

  const getDefaultRoute = () => {
    if (user?.role === 'Admin') return '/dashboard';
    return '/dashboard'; // Default to dashboard for all in no-login mode
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-500 gap-3">
        <Loader2 className="animate-spin text-primary-600" size={40} />
        <span className="font-medium text-lg">Loading SchoolFlow...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <HashRouter>
        <Routes>
          {/* Redirect any login attempt to dashboard */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/print/:type/:id" element={<PrintView />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to={getDefaultRoute()} replace />} />
            
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="my-profile" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
            <Route path="students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            
            <Route path="users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="classes" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
            
            <Route path="fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
            <Route path="staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
            <Route path="staff/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
