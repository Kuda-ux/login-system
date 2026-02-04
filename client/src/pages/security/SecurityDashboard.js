import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, LogOut, UserCheck, UserX, Clock, 
  Shield, RefreshCw, Menu, X, Bell, WifiOff, Activity,
  Eye, Phone, FileText, ChevronRight, Zap
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ checked_in: 0, checked_out_today: 0, total_today: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    const interval = setInterval(fetchVisitors, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchVisitors = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let res;
      
      if (user?.building_id) {
        res = await api.get(`/visitors/building/${user.building_id}?date=${today}&limit=100`);
      } else if (user?.role === 'admin') {
        res = await api.get(`/visitors/all?date=${today}&limit=100`);
      } else {
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
      setSelectedVisitor(null);
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
    <div className="min-h-screen bg-slate-950">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Some features may be limited
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
          <Menu className="w-6 h-6 text-slate-400" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-500" />
          <span className="font-bold text-white">Security Portal</span>
        </div>
        <button className="p-2 -mr-2 relative">
          <Bell className="w-6 h-6 text-slate-400" />
          {stats.checked_in > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
              {stats.checked_in}
            </span>
          )}
        </button>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg">Security</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <p className="text-slate-500 text-sm">Logged in as</p>
              <p className="font-medium text-white">{user?.full_name}</p>
              <p className="text-cyan-400 text-sm capitalize">{user?.role}</p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => { setActiveTab('visitors'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === 'visitors' 
                    ? 'bg-cyan-600/20 text-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                Currently Inside
                {stats.checked_in > 0 && (
                  <span className="ml-auto bg-cyan-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                    {stats.checked_in}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('all'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === 'all' 
                    ? 'bg-cyan-600/20 text-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Clock className="w-5 h-5" />
                Today's Log
              </button>
            </nav>

            <button
              onClick={handleLogout}
              className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-slate-900 border-r border-slate-800 p-6 fixed">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Security Portal</h1>
              <p className="text-slate-500 text-sm">Access Control</p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-slate-400 text-xs uppercase tracking-wider">Live</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
            <p className="text-slate-500 text-sm">Logged in as</p>
            <p className="font-medium text-white">{user?.full_name}</p>
            <p className="text-cyan-400 text-sm capitalize">{user?.role}</p>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveTab('visitors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'visitors' 
                  ? 'bg-cyan-600/20 text-cyan-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              Currently Inside
              {stats.checked_in > 0 && (
                <span className="ml-auto bg-cyan-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {stats.checked_in}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'all' 
                  ? 'bg-cyan-600/20 text-cyan-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              Today's Log
            </button>
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-4 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/30 transition group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                  <UserCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.checked_in}</p>
                  <p className="text-slate-500 text-sm">Currently Inside</p>
                </div>
              </div>
              {stats.checked_in > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-emerald-400 text-xs">Active visitors</span>
                </div>
              )}
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-amber-500/30 transition group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                  <UserX className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.checked_out_today}</p>
                  <p className="text-slate-500 text-sm">Checked Out</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/30 transition group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.total_today}</p>
                  <p className="text-slate-500 text-sm">Total Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search visitors by name, phone, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              />
            </div>
            <button
              onClick={fetchVisitors}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Tab Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'visitors' ? 'Currently Inside' : "Today's Visitor Log"}
            </h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              Auto-refresh: 30s
            </div>
          </div>

          {/* Visitors List */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-500 border-t-transparent mx-auto"></div>
                <p className="text-slate-500 mt-4">Loading visitors...</p>
              </div>
            ) : (activeTab === 'visitors' ? activeVisitors : allVisitors).length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium">No visitors {activeTab === 'visitors' ? 'currently inside' : 'today'}</p>
                <p className="text-slate-600 text-sm mt-1">Visitors will appear here when they check in</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {(activeTab === 'visitors' ? activeVisitors : allVisitors).map((visitor) => (
                  <div 
                    key={visitor.id} 
                    className="p-4 hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => setSelectedVisitor(visitor)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          visitor.status === 'checked_in' 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                            : 'bg-slate-700'
                        }`}>
                          {visitor.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{visitor.full_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-slate-500 text-sm">
                              <Phone className="w-3 h-3" />
                              {visitor.phone}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500 text-sm">
                              <Clock className="w-3 h-3" />
                              {new Date(visitor.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          visitor.status === 'checked_in' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {visitor.status === 'checked_in' ? '● Inside' : 'Left'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedVisitor(null)} />
          <div className="relative bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl">
            <button 
              onClick={() => setSelectedVisitor(null)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 ${
                selectedVisitor.status === 'checked_in' 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-slate-700'
              }`}>
                {selectedVisitor.full_name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-white">{selectedVisitor.full_name}</h3>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                selectedVisitor.status === 'checked_in' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {selectedVisitor.status === 'checked_in' ? '● Currently Inside' : 'Checked Out'}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <Phone className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-slate-500 text-xs">Phone</p>
                  <p className="text-white">{selectedVisitor.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-slate-500 text-xs">Purpose</p>
                  <p className="text-white">{selectedVisitor.purpose}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <Clock className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-slate-500 text-xs">Check-in Time</p>
                  <p className="text-white">{new Date(selectedVisitor.check_in_time).toLocaleString()}</p>
                </div>
              </div>
              {selectedVisitor.check_out_time && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                  <LogOut className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-slate-500 text-xs">Check-out Time</p>
                    <p className="text-white">{new Date(selectedVisitor.check_out_time).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedVisitor.status === 'checked_in' && (
              <button
                onClick={() => handleManualCheckOut(selectedVisitor.id)}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Check Out Visitor
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityDashboard;
