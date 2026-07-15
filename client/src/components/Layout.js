import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { LayoutDashboard, Building2, Users, CreditCard, UserCheck, Clock, LogOut, Menu } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { pendingSync } = useOffline();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'owner', 'staff'] },
    { to: '/buildings', icon: Building2, label: 'Buildings', roles: ['admin', 'owner'] },
    { to: '/visitors', icon: UserCheck, label: 'Visitors', roles: ['admin', 'owner'] },
    { to: '/tenants', icon: Users, label: 'Tenants', roles: ['admin', 'owner'] },
    { to: '/payments', icon: CreditCard, label: 'Payments', roles: ['admin', 'owner'] },
    { to: '/staff-attendance', icon: Clock, label: 'Attendance', roles: ['admin', 'owner', 'staff'] },
  ];

  return (
    <div style={{ display: 'flex' }}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Cherubim Security</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role}</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.filter(item => item.roles.includes(user?.role)).map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <item.icon size={20} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
          {pendingSync > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>{pendingSync} pending sync</div>}
          <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{user?.full_name}</div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', padding: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <button className="btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none', marginBottom: '1rem' }}>
          <Menu size={20} />
        </button>
        <Outlet />
      </main>
    </div>
  );
}
