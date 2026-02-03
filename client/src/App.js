import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VisitorCheckIn from './pages/VisitorCheckIn';
import StaffAttendance from './pages/StaffAttendance';
import Buildings from './pages/Buildings';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Visitors from './pages/Visitors';
import Layout from './components/Layout';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  
  return children;
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <OfflineProvider>
        <Router>
          {!isOnline && (
            <div className="offline-banner">
              You are currently offline. Changes will sync when connection is restored.
            </div>
          )}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/visitor/check-in/:buildingId?" element={<VisitorCheckIn />} />
            
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="buildings" element={<PrivateRoute roles={['admin', 'owner']}><Buildings /></PrivateRoute>} />
              <Route path="visitors" element={<PrivateRoute roles={['admin', 'owner']}><Visitors /></PrivateRoute>} />
              <Route path="tenants" element={<PrivateRoute roles={['admin', 'owner']}><Tenants /></PrivateRoute>} />
              <Route path="payments" element={<PrivateRoute roles={['admin', 'owner']}><Payments /></PrivateRoute>} />
              <Route path="staff-attendance" element={<StaffAttendance />} />
            </Route>
          </Routes>
        </Router>
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;
