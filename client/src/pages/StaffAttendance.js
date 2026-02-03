import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Clock, LogIn, LogOut, Calendar } from 'lucide-react';

export default function StaffAttendance() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        api.get('/staff/status'),
        api.get('/staff/history')
      ]);
      setStatus(statusRes.data);
      setHistory(historyRes.data.attendance || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClockIn = async () => {
    setSubmitting(true);
    try {
      await api.post('/staff/clock-in');
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Clock-in failed'); }
    finally { setSubmitting(false); }
  };

  const handleClockOut = async () => {
    setSubmitting(true);
    try {
      await api.post('/staff/clock-out', { notes });
      setNotes('');
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Clock-out failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Staff Attendance</h1>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Clock size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Current Status</h3>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: status?.status === 'clocked_in' ? 'var(--success)' : 'var(--text-secondary)', marginBottom: '1rem' }}>
            {status?.status === 'clocked_in' ? 'Clocked In' : status?.status === 'clocked_out' ? 'Clocked Out' : 'Not Clocked In'}
          </p>
          {status?.clock_in_time && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Since: {new Date(status.clock_in_time).toLocaleTimeString()}</p>}
          
          <div style={{ marginTop: '1.5rem' }}>
            {status?.action === 'clock_in' && (
              <button onClick={handleClockIn} className="btn btn-success" disabled={submitting}>
                <LogIn size={18} /> {submitting ? 'Processing...' : 'Clock In'}
              </button>
            )}
            {status?.action === 'clock_out' && (
              <div>
                <input className="form-input" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginBottom: '0.5rem' }} />
                <button onClick={handleClockOut} className="btn btn-danger" disabled={submitting}>
                  <LogOut size={18} /> {submitting ? 'Processing...' : 'Clock Out'}
                </button>
              </div>
            )}
            {status?.action === 'done' && <p style={{ color: 'var(--success)' }}>Shift completed for today</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title"><Calendar size={18} /> Today's Summary</h3></div>
          {status?.attendance ? (
            <div>
              <p><strong>Clock In:</strong> {new Date(status.attendance.clock_in_time).toLocaleTimeString()}</p>
              <p><strong>Clock Out:</strong> {status.attendance.clock_out_time ? new Date(status.attendance.clock_out_time).toLocaleTimeString() : '-'}</p>
              <p><strong>Total Hours:</strong> {status.attendance.total_hours || '-'}</p>
            </div>
          ) : <p style={{ color: 'var(--text-secondary)' }}>No attendance record for today</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Attendance History</h3></div>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Notes</th></tr></thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No history</td></tr>
              ) : history.map((record) => (
                <tr key={record.id}>
                  <td>{record.work_date}</td>
                  <td>{new Date(record.clock_in_time).toLocaleTimeString()}</td>
                  <td>{record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString() : '-'}</td>
                  <td>{record.total_hours ? `${record.total_hours}h` : '-'}</td>
                  <td>{record.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
