import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Users, Search, LogOut, UserCheck, UserX, Clock, Building2, 
  Shield, RefreshCw, Menu, X, Bell, Wifi, WifiOff, Camera, CheckCircle
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function SecurityDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('visitors');
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showScanner, setShowScanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ checked_in: 0, checked_out_today: 0, total_today: 0 });
  const videoRef = useRef(null);

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

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const fetchVisitors = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let res;
      
      // If user has a building_id, fetch visitors for that building
      // If admin without building_id, fetch all visitors
      if (user?.building_id) {
        res = await api.get(`/visitors/building/${user.building_id}?date=${today}&limit=100`);
      } else if (user?.role === 'admin') {
        res = await api.get(`/visitors/all?date=${today}&limit=100`);
      } else {
        // No building assigned and not admin - show empty
        setVisitors([]);
        setStats({ checked_in: 0, checked_out_today: 0, total_today: 0 });
        setLoading(false);
        return;
      }
      
      const visitorList = res.data.visitors || [];
      setVisitors(visitorList);
      
      const checkedIn = visitorList.filter(v => v.status === 'checked_in').length;
      const checkedOut = visitorList.filter(v => v.status === 'checked_out').length;
      setStats({
        checked_in: checkedIn,
        checked_out_today: checkedOut,
        total_today: visitorList.length
      });
    } catch (err) {
      console.error('Failed to fetch visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheckOut = async (visitorId) => {
    try {
      await api.post('/visitors/check-out', { visitor_id: visitorId });
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.error || 'Check-out failed');
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm) ||
    v.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeVisitors = filteredVisitors.filter(v => v.status === 'checked_in');
  const allVisitors = filteredVisitors;

  const handleLogout = () => {
    logout();
    navigate('/security/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Some features may be limited
        </div>
      )}

      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 lg:hidden">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="font-bold">Security Portal</span>
          </div>
          <button className="p-2 relative">
            <Bell className="w-6 h-6" />
            {stats.checked_in > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {stats.checked_in}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 text-white p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-400" />
                <span className="font-bold text-lg">Security</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-8">
              <p className="text-gray-400 text-sm">Logged in as</p>
              <p className="font-medium">{user?.full_name}</p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => { setActiveTab('visitors'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === 'visitors' ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <Users className="w-5 h-5" />
                Current Visitors
              </button>
              <button
                onClick={() => { setActiveTab('all'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === 'all' ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <Clock className="w-5 h-5" />
                Today's Log
              </button>
            </nav>

            <button
              onClick={handleLogout}
              className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 rounded-xl hover:bg-red-700 transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Security Portal</h1>
              <p className="text-gray-400 text-sm">Building Access Control</p>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm">Logged in as</p>
            <p className="font-medium">{user?.full_name}</p>
            <p className="text-blue-400 text-sm">{user?.role}</p>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveTab('visitors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'visitors' ? 'bg-blue-600' : 'hover:bg-slate-700'
              }`}
            >
              <Users className="w-5 h-5" />
              Current Visitors
              {stats.checked_in > 0 && (
                <span className="ml-auto bg-blue-500 px-2 py-0.5 rounded-full text-xs">
                  {stats.checked_in}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'all' ? 'bg-blue-600' : 'hover:bg-slate-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              Today's Log
            </button>
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.checked_in}</p>
                  <p className="text-xs text-gray-500">Currently Inside</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <UserX className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.checked_out_today}</p>
                  <p className="text-xs text-gray-500">Checked Out</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total_today}</p>
                  <p className="text-xs text-gray-500">Total Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search visitors by name, phone, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchVisitors}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Visitors List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                {activeTab === 'visitors' ? 'Currently Inside' : "Today's Visitor Log"}
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              </div>
            ) : (activeTab === 'visitors' ? activeVisitors : allVisitors).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No visitors {activeTab === 'visitors' ? 'currently inside' : 'today'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {(activeTab === 'visitors' ? activeVisitors : allVisitors).map((visitor) => (
                  <div key={visitor.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                          visitor.status === 'checked_in' ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {visitor.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{visitor.full_name}</h3>
                          <p className="text-sm text-gray-500">{visitor.phone}</p>
                          <p className="text-sm text-gray-400 mt-1">{visitor.purpose}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              In: {new Date(visitor.check_in_time).toLocaleTimeString()}
                            </span>
                            {visitor.check_out_time && (
                              <span className="flex items-center gap-1">
                                <LogOut className="w-3 h-3" />
                                Out: {new Date(visitor.check_out_time).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          visitor.status === 'checked_in' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {visitor.status === 'checked_in' ? 'Inside' : 'Left'}
                        </span>
                        {visitor.status === 'checked_in' && (
                          <button
                            onClick={() => handleManualCheckOut(visitor.id)}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SecurityDashboard;
