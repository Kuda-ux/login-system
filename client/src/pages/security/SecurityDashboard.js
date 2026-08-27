import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, LogOut, UserCheck, UserX, Clock, 
  Shield, RefreshCw, Menu, X, Bell, WifiOff, Activity,
  Eye, Phone, FileText, ChevronRight, Zap, QrCode, Briefcase,
  LogIn, ScanLine
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
  const [staffEntries, setStaffEntries] = useState([]);
  const [staffStats, setStaffStats] = useState({ inside: 0, exited: 0, total: 0 });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

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
    fetchStaffEntries();
    const interval = setInterval(() => { fetchVisitors(); fetchStaffEntries(); }, 30000);
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

  const fetchStaffEntries = async (dateOverride) => {
    try {
      const d = dateOverride || attendanceDate;
      let res;
      if (user?.building_id) {
        res = await api.get(`/staff/entries/${user.building_id}?date=${d}`);
      } else if (user?.role === 'admin') {
        res = await api.get(`/staff/entries-all?date=${d}`);
      } else {
        return;
      }
      setStaffEntries(res.data.entries || []);
      setStaffStats(res.data.stats || { inside: 0, exited: 0, total: 0 });
    } catch (err) {
      console.error('Failed to fetch staff entries:', err);
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Some features may be limited
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden bg-[#111111] border-b border-[#1f1f1f] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
          <Menu className="w-6 h-6 text-[#888]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#d4ae2a] to-[#b8942a] flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-white">Cherubim Security</span>
        </div>
        <button className="p-2 -mr-2 relative">
          <Bell className="w-6 h-6 text-[#888]" />
          {stats.checked_in > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#d4ae2a] rounded-full text-xs flex items-center justify-center text-black font-bold">
              {stats.checked_in}
            </span>
          )}
        </button>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#111111] p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#d4ae2a] to-[#b8942a] rounded-xl flex items-center justify-center shadow-lg shadow-[#d4ae2a]/10">
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <div>
                  <span className="font-bold text-white text-lg block leading-tight">Cherubim</span>
                  <span className="text-[#d4ae2a] text-xs font-medium">Security</span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-[#555]" />
              </button>
            </div>
            
            <div className="bg-[rgba(212,174,42,0.08)] rounded-xl p-4 mb-6 border border-[#1f1f1f]">
              <p className="text-[#555] text-sm">Logged in as</p>
              <p className="font-medium text-white">{user?.full_name}</p>
              <p className="text-[#d4ae2a] text-sm capitalize">{user?.role}</p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => { setActiveTab('visitors'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'visitors' 
                    ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a]' 
                    : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                Visitors Inside
                {stats.checked_in > 0 && (
                  <span className="ml-auto bg-[#d4ae2a] text-black px-2 py-0.5 rounded-full text-xs font-bold">
                    {stats.checked_in}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('staff'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'staff' 
                    ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a]' 
                    : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                Guard Attendance
                {staffStats.inside > 0 && (
                  <span className="ml-auto bg-[#d4ae2a] text-black px-2 py-0.5 rounded-full text-xs font-bold">
                    {staffStats.inside}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('all'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'all' 
                    ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a]' 
                    : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Clock className="w-5 h-5" />
                Today's Log
              </button>
              <button
                onClick={() => { setSidebarOpen(false); navigate('/security/scan'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-black bg-[#d4ae2a] hover:bg-[#e8c847] transition-all duration-200 font-medium mt-4"
              >
                <ScanLine className="w-5 h-5" />
                Scan Guard QR
              </button>
              {['supervisor', 'security'].includes(user?.role) && (
                <button
                  onClick={() => { setSidebarOpen(false); navigate('/security/incidents'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#d4ae2a] hover:bg-[#1a1a1a] transition-all duration-200 font-medium"
                >
                  <FileText className="w-5 h-5" />
                  Report Incident
                </button>
              )}
            </nav>

            <button
              onClick={handleLogout}
              className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 min-h-screen bg-[#111111] border-r border-[#1f1f1f] p-6 fixed overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#d4ae2a] to-[#b8942a] rounded-xl flex items-center justify-center shadow-lg shadow-[#d4ae2a]/15">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">Cherubim Security</h1>
              <p className="text-[#d4ae2a] text-sm font-medium">Supervisor Control</p>
            </div>
          </div>

          {/* Live Clock */}
          <div className="bg-[#0a0a0a] rounded-2xl p-4 mb-6 border border-[#d4ae2a]/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-[#d4ae2a] animate-pulse" />
              <span className="text-[#888] text-xs uppercase tracking-wider">Live</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[#555] text-sm mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className="bg-[rgba(212,174,42,0.08)] rounded-xl p-4 mb-6 border border-[#1f1f1f]">
            <p className="text-[#555] text-sm">Logged in as</p>
            <p className="font-medium text-white">{user?.full_name}</p>
            <p className="text-[#d4ae2a] text-sm capitalize">{user?.role}</p>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setActiveTab('visitors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'visitors' 
                  ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a] font-medium' 
                  : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              Visitors Inside
              {stats.checked_in > 0 && (
                <span className="ml-auto bg-[#d4ae2a] text-black px-2 py-0.5 rounded-full text-xs font-bold">
                  {stats.checked_in}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'staff' 
                  ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a] font-medium' 
                  : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Guard Attendance
              {staffStats.inside > 0 && (
                <span className="ml-auto bg-[#d4ae2a] text-black px-2 py-0.5 rounded-full text-xs font-bold">
                  {staffStats.inside}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-[rgba(212,174,42,0.1)] text-[#d4ae2a] font-medium' 
                  : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              Today's Log
            </button>
            <button
              onClick={() => navigate('/security/scan')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-black bg-[#d4ae2a] hover:bg-[#e8c847] transition-all duration-200 font-medium mt-4"
            >
              <ScanLine className="w-5 h-5" />
              Scan Guard QR
            </button>
            {['supervisor', 'security'].includes(user?.role) && <button onClick={() => navigate('/security/incidents')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#d4ae2a] bg-[rgba(212,174,42,0.08)] hover:bg-[rgba(212,174,42,0.15)] transition-all duration-200 font-medium border border-[rgba(212,174,42,0.2)]"><FileText className="w-5 h-5" />Report Incident</button>}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 p-4 lg:p-8">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Security Dashboard</h2>
              <p className="text-[#888] text-sm mt-0.5">Live overview of visitors, staff, and patrols</p>
            </div>
            {['supervisor', 'security'].includes(user?.role) && (
              <button
                onClick={() => navigate('/security/incidents')}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[#d4ae2a] text-black rounded-xl font-semibold hover:bg-[#e8c847] transition shadow-lg shadow-[#d4ae2a]/15"
              >
                <FileText className="w-5 h-5" />
                Report Incident
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.checked_in}</p>
                  <p className="text-[#555] text-xs">Visitors In</p>
                </div>
              </div>
            </div>
            <div className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-[#d4ae2a]/30 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgba(212,174,42,0.15)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-5 h-5 text-[#d4ae2a]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{staffStats.inside}</p>
                  <p className="text-[#555] text-xs">Staff In</p>
                </div>
              </div>
            </div>
            <div className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-amber-500/30 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserX className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.checked_out_today}</p>
                  <p className="text-[#555] text-xs">Visitors Out</p>
                </div>
              </div>
            </div>
            <div className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-[#d4ae2a]/30 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgba(212,174,42,0.15)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-5 h-5 text-[#d4ae2a]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total_today}</p>
                  <p className="text-[#555] text-xs">Total Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Scan Button */}
          <button
            onClick={() => navigate('/security/scan')}
            className="lg:hidden w-full flex items-center justify-center gap-2 py-4 bg-[#d4ae2a] hover:bg-[#e8c847] text-black rounded-2xl font-semibold mb-6 shadow-lg shadow-[#d4ae2a]/15 transition-all duration-200"
          >
            <ScanLine className="w-5 h-5" />
            Scan Guard QR Code
          </button>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
              <input
                type="text"
                placeholder={activeTab === 'staff' ? 'Search staff by name...' : 'Search visitors by name, phone, or purpose...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-[#d4ae2a] focus:border-transparent transition-all duration-200 outline-none"
              />
            </div>
            <button
              onClick={() => { fetchVisitors(); fetchStaffEntries(); }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-[#888] hover:text-[#d4ae2a] hover:border-[#d4ae2a]/50 transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Tab Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'visitors' ? 'Visitors Inside' : activeTab === 'staff' ? 'Guard Attendance Today' : "Today's Visitor Log"}
            </h2>
            <div className="flex items-center gap-2 text-[#555] text-sm">
              <Zap className="w-4 h-4 text-[#d4ae2a]" />
              Auto-refresh: 30s
            </div>
          </div>

          {/* Guard Attendance List */}
          {activeTab === 'staff' && (
            <>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-[#888] text-sm">Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => { setAttendanceDate(e.target.value); fetchStaffEntries(e.target.value); }}
                className="px-3 py-2 bg-[#111111] border border-[#2a2a2a] rounded-xl text-sm text-white focus:border-[#d4ae2a] focus:outline-none"
              />
              {attendanceDate !== new Date().toISOString().split('T')[0] && (
                <button
                  onClick={() => { const today = new Date().toISOString().split('T')[0]; setAttendanceDate(today); fetchStaffEntries(today); }}
                  className="text-xs text-[#d4ae2a] hover:text-[#e8c847] font-medium"
                >
                  Back to Today
                </button>
              )}
            </div>
            <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
              {staffEntries.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-10 h-10 text-[#555]" />
                  </div>
                  <p className="text-[#888] font-medium">No staff entries today</p>
                  <p className="text-[#555] text-sm mt-1">Scan a staff QR code to record entry</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1f1f1f]">
                  {staffEntries
                    .filter(e => e.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((entry) => (
                    <div key={entry.id} className="p-4 hover:bg-[#1a1a1a] transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            entry.status === 'inside'
                              ? 'bg-gradient-to-br from-[#d4ae2a] to-[#b8942a] text-black'
                              : 'bg-[#2a2a2a]'
                          }`}>
                            {entry.staff_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{entry.staff_name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[#666] text-sm capitalize">
                                <Shield className="w-3 h-3" />
                                {entry.staff_role}
                              </span>
                              <span className="flex items-center gap-1 text-[#666] text-sm">
                                <LogIn className="w-3 h-3 text-emerald-400" />
                                {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {entry.exit_time && (
                                <span className="flex items-center gap-1 text-[#666] text-sm">
                                  <LogOut className="w-3 h-3 text-amber-400" />
                                  {new Date(entry.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          entry.status === 'inside'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#1a1a1a] text-[#888]'
                        }`}>
                          {entry.status === 'inside' ? '● Inside' : 'Left'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
          )}

          {/* Visitors List */}
          {activeTab !== 'staff' && (
          <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#d4ae2a] border-t-transparent mx-auto"></div>
                <p className="text-[#555] mt-4">Loading visitors...</p>
              </div>
            ) : (activeTab === 'visitors' ? activeVisitors : allVisitors).length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-[#555]" />
                </div>
                <p className="text-[#888] font-medium">No visitors {activeTab === 'visitors' ? 'currently inside' : 'today'}</p>
                <p className="text-[#555] text-sm mt-1">Visitors will appear here when they check in</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f1f]">
                {(activeTab === 'visitors' ? activeVisitors : allVisitors).map((visitor) => (
                  <div 
                    key={visitor.id} 
                    className="p-4 hover:bg-[#1a1a1a] transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedVisitor(visitor)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          visitor.status === 'checked_in' 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                            : 'bg-[#2a2a2a]'
                        }`}>
                          {visitor.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{visitor.full_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[#666] text-sm">
                              <Phone className="w-3 h-3" />
                              {visitor.phone}
                            </span>
                            <span className="flex items-center gap-1 text-[#666] text-sm">
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
                            : 'bg-[#1a1a1a] text-[#888]'
                        }`}>
                          {visitor.status === 'checked_in' ? '● Inside' : 'Left'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-[#555]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </main>
      </div>

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedVisitor(null)} />
          <div className="relative bg-[#111111] rounded-3xl p-6 max-w-md w-full border border-[#2a2a2a] shadow-2xl shadow-black/50">
            <button 
              onClick={() => setSelectedVisitor(null)}
              className="absolute top-4 right-4 p-2 text-[#555] hover:text-white transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 ${
                selectedVisitor.status === 'checked_in' 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-[#2a2a2a]'
              }`}>
                {selectedVisitor.full_name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-white">{selectedVisitor.full_name}</h3>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                selectedVisitor.status === 'checked_in' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-[#1a1a1a] text-[#888]'
              }`}>
                {selectedVisitor.status === 'checked_in' ? '● Currently Inside' : 'Checked Out'}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#1f1f1f]">
                <Phone className="w-5 h-5 text-[#d4ae2a]" />
                <div>
                  <p className="text-[#555] text-xs">Phone</p>
                  <p className="text-white">{selectedVisitor.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#1f1f1f]">
                <FileText className="w-5 h-5 text-[#d4ae2a]" />
                <div>
                  <p className="text-[#555] text-xs">Purpose</p>
                  <p className="text-white">{selectedVisitor.purpose}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#1f1f1f]">
                <Clock className="w-5 h-5 text-[#d4ae2a]" />
                <div>
                  <p className="text-[#555] text-xs">Check-in Time</p>
                  <p className="text-white">{new Date(selectedVisitor.check_in_time).toLocaleString()}</p>
                </div>
              </div>
              {selectedVisitor.check_out_time && (
                <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#1f1f1f]">
                  <LogOut className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-[#555] text-xs">Check-out Time</p>
                    <p className="text-white">{new Date(selectedVisitor.check_out_time).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedVisitor.status === 'checked_in' && (
              <button
                onClick={() => handleManualCheckOut(selectedVisitor.id)}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2"
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
