import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, LogIn, LogOut, User, Calendar, Timer, CheckCircle, 
  AlertCircle, Wifi, WifiOff, Building2, History
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function StaffPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // 'not_clocked_in', 'clocked_in', 'clocked_out'
  const [clockInTime, setClockInTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Attendance will sync when connected
        </div>
      )}

      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="text-white">
            <p className="font-semibold">{user?.full_name}</p>
            <p className="text-white/70 text-sm">Staff Member</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-3 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-6">
        {/* Date & Time Card */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-6 text-center text-white">
          <p className="text-white/70 text-sm mb-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-5xl font-bold tracking-tight">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          <div className="text-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              status === 'clocked_in' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {status === 'clocked_in' ? (
                <Timer className="w-12 h-12 text-green-600" />
              ) : (
                <Clock className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {status === 'clocked_in' ? (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Currently Working</h2>
                <p className="text-gray-500 mb-4">Clocked in at {clockInTime?.toLocaleTimeString()}</p>
                <div className="bg-green-50 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-green-600 mb-1">Time Elapsed</p>
                  <p className="text-3xl font-bold text-green-700 font-mono">{getElapsedTime()}</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {status === 'clocked_out' ? 'Shift Completed' : 'Ready to Start'}
                </h2>
                <p className="text-gray-500 mb-6">
                  {status === 'clocked_out' ? 'You have clocked out for today' : 'Clock in to start your shift'}
                </p>
              </>
            )}
          </div>

          {status === 'clocked_in' ? (
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Clock In
                </>
              )}
            </button>
          ) : null}
        </div>

        {/* History Toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between bg-white/10 backdrop-blur text-white rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5" />
            <span className="font-medium">Attendance History</span>
          </div>
          <span className="text-white/70">{showHistory ? '▲' : '▼'}</span>
        </button>

        {/* History List */}
        {showHistory && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            {history.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No attendance records yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.map((record) => (
                  <div key={record.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {new Date(record.work_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {record.total_hours && (
                        <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {parseFloat(record.total_hours).toFixed(1)} hrs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <LogIn className="w-3 h-3" />
                        {record.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <LogOut className="w-3 h-3" />
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
