import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, UserCheck, DollarSign, TrendingUp, Clock, 
  Calendar, Bell, Settings, LogOut, Menu, X, ChevronRight,
  Home, CreditCard, UserPlus, BarChart3, FileText, Shield
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
    { path: '/admin/buildings', icon: Building2, label: 'Buildings' },
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-gray-800">Admin Portal</span>
        </div>
        <button className="p-2 -mr-2 relative">
          <Bell className="w-6 h-6 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-800">Admin Portal</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-400" />
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
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-gray-600">{user?.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user?.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition"
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
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 fixed">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-800">BuildingMS</h1>
                <p className="text-xs text-gray-500">Admin Portal</p>
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
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user?.full_name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Welcome back, {user?.full_name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-500 mt-1">Here's what's happening with your buildings today.</p>
              </div>

              {/* Stats Grid */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                      <div className="h-10 w-10 bg-gray-200 rounded-xl mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats?.total_buildings || 0}</p>
                    <p className="text-gray-500 text-sm">Total Buildings</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats?.active_visitors || 0}</p>
                    <p className="text-gray-500 text-sm">Active Visitors</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{stats?.total_tenants || 0}</p>
                    <p className="text-gray-500 text-sm">Total Tenants</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">
                      ${(stats?.monthly_revenue || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">Monthly Revenue</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link
                  to="/admin/buildings"
                  className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 hover:shadow-lg transition group"
                >
                  <Building2 className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">Manage Buildings</p>
                  <p className="text-blue-100 text-sm">Add or edit buildings</p>
                </Link>
                <Link
                  to="/admin/visitors"
                  className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 hover:shadow-lg transition group"
                >
                  <UserCheck className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">View Visitors</p>
                  <p className="text-green-100 text-sm">Today's visitor log</p>
                </Link>
                <Link
                  to="/admin/tenants"
                  className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 hover:shadow-lg transition group"
                >
                  <UserPlus className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">Add Tenant</p>
                  <p className="text-purple-100 text-sm">Register new tenant</p>
                </Link>
                <Link
                  to="/admin/payments"
                  className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-6 hover:shadow-lg transition group"
                >
                  <CreditCard className="w-8 h-8 mb-3 group-hover:scale-110 transition" />
                  <p className="font-semibold">Payments</p>
                  <p className="text-amber-100 text-sm">View & collect rent</p>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Visitors */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Recent Visitors</h2>
                    <Link to="/admin/visitors" className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {recentActivity.recent_visitors?.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">No recent visitors</div>
                    ) : (
                      recentActivity.recent_visitors?.slice(0, 5).map((visitor) => (
                        <div key={visitor.id} className="p-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            visitor.status === 'checked_in' ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            {visitor.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{visitor.full_name}</p>
                            <p className="text-sm text-gray-500 truncate">{visitor.building_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            visitor.status === 'checked_in' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {visitor.status === 'checked_in' ? 'Inside' : 'Left'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Recent Payments</h2>
                    <Link to="/admin/payments" className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
                      View all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {recentActivity.recent_payments?.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">No recent payments</div>
                    ) : (
                      recentActivity.recent_payments?.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{payment.tenant_name}</p>
                            <p className="text-sm text-gray-500">{payment.rent_month}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">${payment.amount}</p>
                            <span className={`text-xs ${
                              payment.payment_status === 'completed' ? 'text-green-600' : 'text-amber-600'
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
