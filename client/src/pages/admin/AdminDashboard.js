import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, UserCheck, DollarSign, TrendingUp, Clock, 
  Calendar, Bell, Settings, LogOut, Menu, X, ChevronRight,
  Home, CreditCard, UserPlus, BarChart3, FileText, Shield, ShieldCheck, ClipboardCheck, AlertTriangle, PackageCheck, Car, Crosshair
} from 'lucide-react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState({ visitors: [], incidents: [], patrols: [] });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, visitorsRes, incidentsRes, patrolsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/visitors/all?date=today&limit=5'),
        api.get('/operations/incidents?limit=5'),
        api.get('/operations/patrols?limit=5')
      ]);
      setStats(statsRes.data);
      setRecentActivity({
        visitors: visitorsRes.data.visitors || [],
        incidents: incidentsRes.data.incidents || [],
        patrols: patrolsRes.data.patrols || []
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', icon: Home, label: 'Dashboard', exact: true },
    { path: '/admin/operations', icon: ClipboardCheck, label: 'Operations' },
    { path: '/admin/guards', icon: Shield, label: 'Guard E-Files' },
    { path: '/admin/incidents', icon: AlertTriangle, label: 'Incidents' },
    { path: '/admin/assets', icon: PackageCheck, label: 'Asset Tags' },
    { path: '/admin/vehicles', icon: Car, label: 'Vehicles' },
    { path: '/admin/weapons', icon: Crosshair, label: 'Weapons' },
    { path: '/admin/buildings', icon: Building2, label: 'Client Sites' },
    { path: '/admin/visitors', icon: UserCheck, label: 'Visitors' },
    { path: '/admin/staff', icon: Users, label: 'Staff' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Mobile Header */}
      <header className="lg:hidden bg-[#111111] border-b border-[#1f1f1f] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
          <Menu className="w-6 h-6 text-[#888888]" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#d4ae2a]" />
          <span className="font-bold text-white">Admin Portal</span>
        </div>
        <button className="p-2 -mr-2 relative">
          <Bell className="w-6 h-6 text-[#888888]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#111111] shadow-2xl shadow-black/50">
            <div className="p-6 border-b border-[#1f1f1f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-lg shadow-[#d4ae2a]/20">
                  <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-white">Cherubim Security HQ</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-[#555555]" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.path, item.exact)
                      ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a] font-medium'
                      : 'text-[#888888] hover:bg-[rgba(212,174,42,0.08)] hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#1f1f1f]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#d4ae2a] to-[#b8941f] rounded-full flex items-center justify-center">
                  <span className="font-semibold text-white">{user?.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{user?.full_name}</p>
                  <p className="text-sm text-[#555555] capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#111111] border-r border-[#1f1f1f] fixed">
          <div className="p-6 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-lg shadow-[#d4ae2a]/20">
                <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-white">Cherubim Security</h1>
                <p className="text-xs text-[#d4ae2a]">Headquarters Operations</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path, item.exact)
                    ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a] font-medium'
                    : 'text-[#888888] hover:bg-[rgba(212,174,42,0.08)] hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-[#1f1f1f]">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#d4ae2a] to-[#b8941f] rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-[#d4ae2a]/20">
                {user?.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-sm text-[#555555] capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[#888888] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-8">
          {location.pathname === '/admin' ? (
            <>
              {/* Welcome Header */}
              <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Welcome back, {user?.full_name?.split(' ')[0]}!
                </h1>
                <p className="text-[#888888] mt-1">Here's what's happening with your buildings today.</p>
              </div>

              {/* Stats Grid */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#111111] rounded-2xl p-6 animate-pulse border border-[#1f1f1f]">
                      <div className="h-10 w-10 bg-[#1f1f1f] rounded-xl mb-4"></div>
                      <div className="h-8 bg-[#1f1f1f] rounded w-16 mb-2"></div>
                      <div className="h-4 bg-[#1f1f1f] rounded w-24"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <div className="bg-[#111111] rounded-2xl p-6 border border-[#1f1f1f] hover:border-[#2a2a2a] transition">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.total_buildings || 0}</p>
                    <p className="text-[#555555] text-sm">Client Sites</p>
                  </div>
                  <div className="bg-[#111111] rounded-2xl p-6 border border-[#1f1f1f] hover:border-[#2a2a2a] transition">
                    <div className="w-12 h-12 bg-[rgba(212,174,42,0.15)] rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-[#d4ae2a]" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.total_staff || 0}</p>
                    <p className="text-[#555555] text-sm">Guards/Staff</p>
                  </div>
                  <div className="bg-[#111111] rounded-2xl p-6 border border-[#1f1f1f] hover:border-[#2a2a2a] transition">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                      <UserCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.active_visitors || 0}</p>
                    <p className="text-[#555555] text-sm">Visitors On Site</p>
                  </div>
                  <div className="bg-[#111111] rounded-2xl p-6 border border-[#1f1f1f] hover:border-[#2a2a2a] transition">
                    <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center mb-4">
                      <ClipboardCheck className="w-6 h-6 text-sky-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.active_patrols || 0}</p>
                    <p className="text-[#555555] text-sm">Active Patrols</p>
                  </div>
                  <div className="bg-[#111111] rounded-2xl p-6 border border-[#1f1f1f] hover:border-[#2a2a2a] transition">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.open_incidents || 0}</p>
                    <p className="text-[#555555] text-sm">Open Incidents</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link
                  to="/admin/operations"
                  className="bg-[#111111] text-white rounded-2xl p-6 border border-[#1f1f1f] hover:border-[#d4ae2a]/30 hover:shadow-lg hover:shadow-[#d4ae2a]/5 transition-all duration-300 group"
                >
                  <ShieldCheck className="w-8 h-8 mb-3 text-[#d4ae2a] group-hover:scale-110 transition" />
                  <p className="font-semibold">Operations Center</p>
                  <p className="text-[#555555] text-sm">Patrols, incidents, attendance</p>
                </Link>
                <Link
                  to="/admin/visitors"
                  className="bg-[#111111] text-white rounded-2xl p-6 border border-[#1f1f1f] hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group"
                >
                  <UserCheck className="w-8 h-8 mb-3 text-emerald-400 group-hover:scale-110 transition" />
                  <p className="font-semibold">Visitor Logs</p>
                  <p className="text-[#555555] text-sm">Check-ins and check-outs</p>
                </Link>
                <Link
                  to="/admin/vehicles"
                  className="bg-[#111111] text-white rounded-2xl p-6 border border-[#1f1f1f] hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
                >
                  <Car className="w-8 h-8 mb-3 text-blue-400 group-hover:scale-110 transition" />
                  <p className="font-semibold">Vehicle Tracking</p>
                  <p className="text-[#555555] text-sm">Fleet GPS & assignments</p>
                </Link>
                <Link
                  to="/admin/weapons"
                  className="bg-[#111111] text-white rounded-2xl p-6 border border-[#1f1f1f] hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group"
                >
                  <Crosshair className="w-8 h-8 mb-3 text-amber-400 group-hover:scale-110 transition" />
                  <p className="font-semibold">Weapons</p>
                  <p className="text-[#555555] text-sm">Issuance & clearance</p>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Visitors */}
                <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
                  <div className="p-6 border-b border-[#1f1f1f] flex items-center justify-between">
                    <h2 className="font-semibold text-white">Recent Visitors</h2>
                    <Link to="/admin/visitors" className="text-[#d4ae2a] text-sm hover:text-[#e8c847] flex items-center gap-1 transition">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-[#1f1f1f]">
                    {recentActivity.recent_visitors?.length === 0 ? (
                      <div className="p-6 text-center text-[#555555]">No recent visitors</div>
                    ) : (
                      recentActivity.recent_visitors?.slice(0, 5).map((visitor) => (
                        <div key={visitor.id} className="p-4 flex items-center gap-4 hover:bg-[rgba(212,174,42,0.04)] transition">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            visitor.status === 'checked_in' ? 'bg-emerald-600' : 'bg-[#2a2a2a]'
                          }`}>
                            {visitor.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{visitor.full_name}</p>
                            <p className="text-sm text-[#555555] truncate">{visitor.building_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            visitor.status === 'checked_in' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-[#1f1f1f] text-[#888888]'
                          }`}>
                            {visitor.status === 'checked_in' ? 'Inside' : 'Left'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Incidents */}
                <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
                  <div className="p-6 border-b border-[#1f1f1f] flex items-center justify-between">
                    <h2 className="font-semibold text-white">Recent Incidents</h2>
                    <Link to="/admin/incidents" className="text-[#d4ae2a] text-sm hover:text-[#e8c847] flex items-center gap-1 transition">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-[#1f1f1f]">
                    {recentActivity.incidents?.length === 0 ? (
                      <div className="p-6 text-center text-[#555555]">No recent incidents</div>
                    ) : (
                      recentActivity.incidents?.slice(0, 5).map((incident) => (
                        <div key={incident.id} className="p-4 flex items-center gap-4 hover:bg-[rgba(212,174,42,0.04)] transition">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            incident.severity === 'high' ? 'bg-red-500/20' : incident.severity === 'medium' ? 'bg-amber-500/20' : 'bg-[#1f1f1f]'
                          }`}>
                            <AlertTriangle className={`w-5 h-5 ${
                              incident.severity === 'high' ? 'text-red-400' : incident.severity === 'medium' ? 'text-amber-400' : 'text-[#888888]'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{incident.title}</p>
                            <p className="text-sm text-[#555555]">{incident.site_name} · {incident.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white text-xs uppercase">{incident.severity}</p>
                            <span className={`text-xs ${
                              incident.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {incident.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
