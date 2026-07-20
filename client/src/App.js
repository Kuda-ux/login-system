import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';

// Visitor Interface
import VisitorCheckInPage from './pages/visitor/VisitorCheckInPage';

// Security Interface
import SecurityLogin from './pages/security/SecurityLogin';
import SecurityDashboard from './pages/security/SecurityDashboard';
import StaffQRScanner from './pages/security/StaffQRScanner';

// Staff Interface
import StaffLogin from './pages/staff/StaffLogin';
import StaffPortal from './pages/staff/StaffPortal';

// Admin Interface
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffManagement from './pages/admin/StaffManagement';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Operations from './pages/admin/Operations';
import GuardFiles from './pages/admin/GuardFiles';
import Incidents from './pages/admin/Incidents';
import Assets from './pages/admin/Assets';
import Vehicles from './pages/admin/Vehicles';
import Weapons from './pages/admin/Weapons';
import Patrol from './pages/staff/Patrol';
import Buildings from './pages/Buildings';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Visitors from './pages/Visitors';

// Landing Page
import LandingPage from './pages/LandingPage';

// Redirect component for old QR code URL format
function VisitorCheckInRedirect() {
  const { buildingId } = useParams();
  return <Navigate to={`/checkin/${buildingId}`} replace />;
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  );
}

// Protected Route for Security (Supervisors/Managers + Admin)
function SecurityRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/security/login" />;
  if (!['security', 'supervisor', 'admin'].includes(user.role)) return <Navigate to="/security/login" />;
  return children;
}

// Protected Route for Staff (Guards + Admin)
function StaffRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/staff/login" />;
  if (!['staff', 'admin'].includes(user.role)) return <Navigate to="/staff/login" />;
  return children;
}

// Protected Route for Admin
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/admin/login" />;
  if (!['admin', 'owner'].includes(user.role)) return <Navigate to="/admin/login" />;
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
          <Routes>
            {/* ========== VISITOR INTERFACE ========== */}
            {/* Public - No login required */}
            <Route path="/checkin/:buildingId" element={<VisitorCheckInPage />} />
            <Route path="/visitor/:buildingId" element={<VisitorCheckInPage />} />
            {/* Redirect old QR code URL format to new format */}
            <Route path="/visitor/check-in/:buildingId" element={<VisitorCheckInRedirect />} />
            
            {/* ========== SECURITY INTERFACE ========== */}
            <Route path="/security/login" element={<SecurityLogin />} />
            <Route path="/security" element={<SecurityRoute><SecurityDashboard /></SecurityRoute>} />
            <Route path="/security/scan" element={<SecurityRoute><StaffQRScanner /></SecurityRoute>} />
            <Route path="/security/incidents" element={<SecurityRoute><Incidents /></SecurityRoute>} />
            
            {/* ========== STAFF INTERFACE ========== */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff" element={<StaffRoute><StaffPortal /></StaffRoute>} />
            <Route path="/patrol" element={<StaffRoute><Patrol /></StaffRoute>} />
            
            {/* ========== ADMIN INTERFACE ========== */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
              <Route path="buildings" element={<Buildings />} />
              <Route path="visitors" element={<Visitors />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="payments" element={<Payments />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="operations" element={<Operations />} />
              <Route path="guards" element={<GuardFiles />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="assets" element={<Assets />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="weapons" element={<Weapons />} />
            </Route>
            
            {/* ========== DEFAULT ROUTES ========== */}
            <Route path="/login" element={<Navigate to="/admin/login" />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </OfflineProvider>
    </AuthProvider>
  );
}

export default App;
