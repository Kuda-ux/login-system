import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, LogIn, LogOut, User, Calendar, Timer, CheckCircle, 
  AlertCircle, WifiOff, History, Briefcase, TrendingUp, ChevronDown, ChevronUp,
  QrCode, Download, ClipboardCheck
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function StaffPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [clockInTime, setClockInTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [staffQR, setStaffQR] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

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
    fetchStatus();
    fetchHistory();
    fetchMyQR();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/staff/status');
      setStatus(res.data.status);
      if (res.data.clock_in_time) {
        setClockInTime(new Date(res.data.clock_in_time));
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setStatus('not_clocked_in');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/staff/history?limit=10');
      setHistory(res.data.attendance || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchMyQR = async () => {
    try {
      const res = await api.get('/staff/my-qrcode');
      setStaffQR(res.data.qr_code);
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
    }
  };

  const generateQR = async () => {
    setQrLoading(true);
    try {
      const res = await api.get('/staff/my-qrcode');
      setStaffQR(res.data.qr_code);
      setShowQR(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/staff/clock-in');
      setStatus('clocked_in');
      setClockInTime(new Date(res.data.attendance.clock_in_time));
      setSuccess('Successfully clocked in!');
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Clock-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/staff/clock-out');
      setStatus('clocked_out');
      setClockInTime(null);
      setSuccess('Successfully clocked out!');
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Clock-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const getElapsedTime = () => {
    if (!clockInTime) return '00:00:00';
    const diff = currentTime - clockInTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalHoursThisWeek = () => {
    const total = history.reduce((sum, record) => sum + (parseFloat(record.total_hours) || 0), 0);
    return total.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d4ae2a] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#888]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Attendance will sync when connected
        </div>
      )}

      {/* Header */}
      <header className="bg-[#111111] border-b border-[#1f1f1f] p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center shadow-lg shadow-[#d4ae2a]/20">
              <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-semibold text-white">{user?.full_name}</p>
              <p className="text-[#d4ae2a] text-xs flex items-center gap-1 font-medium uppercase tracking-wider">
                <Briefcase className="w-3 h-3" />
                Cherubim Guard
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-[#1a1a1a] rounded-xl text-[#888] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <button onClick={() => navigate('/patrol')} className="w-full mb-5 py-3.5 bg-[rgba(212,174,42,0.08)] border border-[rgba(212,174,42,0.2)] text-[#d4ae2a] rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-[rgba(212,174,42,0.15)] transition-all">
          <ClipboardCheck className="w-5 h-5" /> Start Asset Patrol
        </button>

        {/* Live Clock Card */}
        <div className="bg-[#111111] border border-[rgba(212,174,42,0.15)] rounded-3xl p-6 mb-6 text-center shadow-xl shadow-[#d4ae2a]/5">
          <p className="text-[#888] text-sm mb-2">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-5xl font-bold text-white tracking-tight font-mono">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-[#666] text-xs">This Week</span>
            </div>
            <p className="text-2xl font-bold text-white">{getTotalHoursThisWeek()} <span className="text-sm text-[#555] font-normal">hrs</span></p>
          </div>
          <div className="bg-[#111111] rounded-2xl p-4 border border-[#1f1f1f]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#d4ae2a]" />
              <span className="text-[#666] text-xs">Records</span>
            </div>
            <p className="text-2xl font-bold text-white">{history.length} <span className="text-sm text-[#555] font-normal">days</span></p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-[#111111] rounded-3xl p-6 border border-[#1f1f1f] mb-6">
          {error && (
            <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-red-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] text-emerald-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          <div className="text-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              status === 'clocked_in' 
                ? 'bg-[rgba(34,197,94,0.1)] ring-4 ring-[rgba(34,197,94,0.2)]' 
                : 'bg-[#1a1a1a]'
            }`}>
              {status === 'clocked_in' ? (
                <Timer className="w-12 h-12 text-emerald-400" />
              ) : (
                <Clock className="w-12 h-12 text-[#444]" />
              )}
            </div>

            {status === 'clocked_in' ? (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Currently Working</h2>
                <p className="text-[#888] mb-4">Clocked in at {clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.15)] rounded-2xl p-4 mb-6">
                  <p className="text-sm text-emerald-400 mb-1">Time Elapsed</p>
                  <p className="text-4xl font-bold text-emerald-400 font-mono">{getElapsedTime()}</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-1">
                  {status === 'clocked_out' ? 'Shift Completed' : 'Ready to Start'}
                </h2>
                <p className="text-[#888] mb-6">
                  {status === 'clocked_out' ? 'Great work today! See you tomorrow.' : 'Clock in to start your shift'}
                </p>
              </>
            )}
          </div>

          {status === 'clocked_in' ? (
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  Clock Out
                </>
              )}
            </button>
          ) : status !== 'clocked_out' ? (
            <button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="w-full py-4 bg-[#d4ae2a] text-black rounded-xl font-bold hover:bg-[#e8c847] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#d4ae2a]/15"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Clock In
                </>
              )}
            </button>
          ) : (
            <div className="text-center py-4">
              <p className="text-[#666] text-sm">You've completed your shift for today</p>
            </div>
          )}
        </div>

        {/* My QR Code Toggle */}
        <button
          onClick={() => { if (!staffQR) generateQR(); else setShowQR(!showQR); }}
          className="w-full flex items-center justify-between bg-[#111111] border border-[#1f1f1f] text-white rounded-2xl p-4 mb-4 hover:border-[rgba(212,174,42,0.2)] transition-all"
        >
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-[#d4ae2a]" />
            <span className="font-medium">My Building Pass QR</span>
          </div>
          {qrLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#d4ae2a] border-t-transparent"></div>
          ) : showQR ? (
            <ChevronUp className="w-5 h-5 text-[#555]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#555]" />
          )}
        </button>

        {/* QR Code Display */}
        {showQR && staffQR && (
          <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6 mb-4 text-center">
            <p className="text-[#888] text-sm mb-4">Show this QR code to security when entering or leaving the building</p>
            <div className="bg-white rounded-2xl p-4 inline-block mb-4">
              <img src={staffQR} alt="Staff QR Code" className="w-56 h-56 mx-auto" />
            </div>
            <p className="text-white font-semibold">{user?.full_name}</p>
            <p className="text-[#d4ae2a] text-sm capitalize font-medium">{user?.role}</p>
            <a
              href={staffQR}
              download={`staff-qr-${user?.full_name?.replace(/\s/g, '-')}.png`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-[#888] rounded-xl hover:text-[#d4ae2a] transition text-sm"
            >
              <Download className="w-4 h-4" />
              Save QR Code
            </a>
          </div>
        )}

        {/* History Toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between bg-[#111111] border border-[#1f1f1f] text-white rounded-2xl p-4 mb-4 hover:border-[#2a2a2a] transition-all"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-[#d4ae2a]" />
            <span className="font-medium">Attendance History</span>
          </div>
          {showHistory ? (
            <ChevronUp className="w-5 h-5 text-[#555]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#555]" />
          )}
        </button>

        {/* History List */}
        {showHistory && (
          <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-[#333]" />
                <p className="text-[#666]">No attendance records yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f1f]">
                {history.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-[rgba(212,174,42,0.04)] transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">
                        {new Date(record.work_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {record.total_hours && (
                        <span className="text-sm bg-[rgba(212,174,42,0.1)] text-[#d4ae2a] px-3 py-1 rounded-full font-medium">
                          {parseFloat(record.total_hours).toFixed(1)} hrs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#666]">
                      <span className="flex items-center gap-1">
                        <LogIn className="w-3 h-3 text-emerald-400" />
                        {record.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <LogOut className="w-3 h-3 text-amber-400" />
                        {record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StaffPortal;
