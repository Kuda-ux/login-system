import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, UserCheck, DollarSign, TrendingUp, Clock, 
  Calendar, Bell, Settings, LogOut, Menu, X, ChevronRight,
  Home, CreditCard, UserPlus, BarChart3, FileText, Shield, ClipboardCheck, AlertTriangle, PackageCheck
} from 'lucide-react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState({ visitors: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity?limit=5')
      ]);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
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
    { path: '/admin/buildings', icon: Building2, label: 'Client Sites' },
    { path: '/admin/visitors', icon: UserCheck, label: 'Visitors' },
    { path: '/admin/tenants', icon: Users, label: 'Tenants' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/admin/staff', icon: Shield, label: 'Staff' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
          <Menu className="w-6 h-6 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-white">Admin Portal</span>
        </div>
        <button className="p-2 -mr-2 relative">
          <Bell className="w-6 h-6 text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 shadow-xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center">
                  <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-white">Cherubim Security HQ</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive(item.path, item.exact)
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-white">{user?.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{user?.full_name}</p>
                  <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
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
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-800 fixed">
          <div className="p-6 border-b border-slate-800">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive(item.path, item.exact)
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/20">
                {user?.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
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
                <p className="text-slate-400 mt-1">Here's what's happening with your buildings today.</p>
              </div>

              {/* Stats Grid */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-900 rounded-2xl p-6 animate-pulse border border-slate-800">
                      <div className="h-10 w-10 bg-slate-800 rounded-xl mb-4"></div>
                      <div className="h-8 bg-slate-800 rounded w-16 mb-2"></div>
                      <div className="h-4 bg-slate-800 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.total_buildings || 0}</p>
                    <p className="text-slate-500 text-sm">Total Buildings</p>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                      <UserCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.active_visitors || 0}</p>
                    <p className="text-slate-500 text-sm">Active Visitors</p>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.total_tenants || 0}</p>
                    <p className="text-slate-500 text-sm">Total Tenants</p>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                      ${(stats?.monthly_revenue || 0).toLocaleString()}
                    </p>
                    <p className="text-slate-500 text-sm">Monthly Revenue</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link
                  to="/admin/buildings"
                  className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/20 transition group border border-blue-500/20"
                >
                  <Building2 className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">Manage Buildings</p>
                  <p className="text-blue-200 text-sm">Add or edit buildings</p>
                </Link>
                <Link
                  to="/admin/visitors"
                  className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-6 hover:shadow-lg hover:shadow-emerald-500/20 transition group border border-emerald-500/20"
                >
                  <UserCheck className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">View Visitors</p>
                  <p className="text-emerald-200 text-sm">Today's visitor log</p>
                </Link>
                <Link
                  to="/admin/tenants"
                  className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/20 transition group border border-purple-500/20"
                >
                  <UserPlus className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">Add Tenant</p>
                  <p className="text-purple-200 text-sm">Register new tenant</p>
                </Link>
                <Link
                  to="/admin/payments"
                  className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-2xl p-6 hover:shadow-lg hover:shadow-amber-500/20 transition group border border-amber-500/20"
                >
                  <CreditCard className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">Payments</p>
                  <p className="text-amber-200 text-sm">View & collect rent</p>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Visitors */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Recent Visitors</h2>
                    <Link to="/admin/visitors" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {recentActivity.recent_visitors?.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">No recent visitors</div>
                    ) : (
                      recentActivity.recent_visitors?.slice(0, 5).map((visitor) => (
                        <div key={visitor.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            visitor.status === 'checked_in' ? 'bg-emerald-600' : 'bg-slate-600'
                          }`}>
                            {visitor.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{visitor.full_name}</p>
                            <p className="text-sm text-slate-500 truncate">{visitor.building_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            visitor.status === 'checked_in' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {visitor.status === 'checked_in' ? 'Inside' : 'Left'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Recent Payments</h2>
                    <Link to="/admin/payments" className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-800">
                    {recentActivity.recent_payments?.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">No recent payments</div>
                    ) : (
                      recentActivity.recent_payments?.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{payment.tenant_name}</p>
                            <p className="text-sm text-slate-500">{payment.rent_month}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">${payment.amount}</p>
                            <span className={`text-xs ${
                              payment.payment_status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {payment.payment_status}
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
