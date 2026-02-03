import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useOffline } from '../context/OfflineContext';
import { Building2, User, Phone, CreditCard, FileText, CheckCircle, LogOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function generateFingerprint() {
  const nav = window.navigator;
  const screen = window.screen;
  const data = [nav.userAgent, nav.language, screen.width, screen.height, new Date().getTimezoneOffset()].join('|');
  let hash = 0;
  for (let i = 0; i < data.length; i++) { hash = ((hash << 5) - hash) + data.charCodeAt(i); hash |= 0; }
  return hash.toString(16);
}

export default function VisitorCheckIn() {
  const { buildingId } = useParams();
  const { saveOffline } = useOffline();
  const [building, setBuilding] = useState(null);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', id_number: '', purpose: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const fingerprint = generateFingerprint();

  useEffect(() => {
    if (buildingId) { fetchBuilding(); checkStatus(); }
    else setLoading(false);
  }, [buildingId]);

  const fetchBuilding = async () => {
    try {
      const res = await api.get(`/buildings/${buildingId}/public`);
      setBuilding(res.data.building);
    } catch (err) { setError('Building not found'); }
  };

  const checkStatus = async () => {
    try {
      const res = await api.post('/visitors/status', { building_id: buildingId, device_fingerprint: fingerprint });
      setStatus(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      if (navigator.onLine) {
        const res = await api.post('/visitors/check-in', { ...form, building_id: buildingId, device_fingerprint: fingerprint });
        setSuccess({ type: 'checkin', message: 'Check-in successful!', time: res.data.check_in_time });
      } else {
        await saveOffline('visitors', { id: uuidv4(), ...form, building_id: buildingId, device_fingerprint: fingerprint, status: 'checked_in', check_in_time: new Date().toISOString() });
        setSuccess({ type: 'checkin', message: 'Check-in saved offline!', offline: true });
      }
      setStatus({ status: 'checked_in', action: 'checkout' });
    } catch (err) { setError(err.response?.data?.error || 'Check-in failed'); }
    finally { setSubmitting(false); }
  };

  const handleCheckOut = async () => {
    setSubmitting(true); setError('');
    try {
      const res = await api.post('/visitors/check-out', { building_id: buildingId, device_fingerprint: fingerprint });
      setSuccess({ type: 'checkout', message: 'Check-out successful!', name: res.data.visitor_name, duration: res.data.duration_minutes });
      setStatus({ status: 'not_checked_in', action: 'checkin' });
      setForm({ full_name: '', phone: '', id_number: '', purpose: '' });
    } catch (err) { setError(err.response?.data?.error || 'Check-out failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="check-in-page"><div className="spinner"></div></div>;
  if (!buildingId) return (
    <div className="check-in-page">
      <div className="check-in-card" style={{ textAlign: 'center' }}>
        <Building2 size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2>Visitor Check-In</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Please scan the QR code at the building entrance to check in.</p>
      </div>
    </div>
  );

  return (
    <div className="check-in-page">
      <div className="check-in-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Building2 size={40} color="var(--primary)" />
          <h2 style={{ marginTop: '0.5rem' }}>{building?.name || 'Building'}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{building?.address}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success" style={{ textAlign: 'center' }}>
            <CheckCircle size={32} style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600 }}>{success.message}</p>
            {success.duration && <p style={{ fontSize: '0.875rem' }}>Duration: {success.duration} minutes</p>}
            {success.offline && <p style={{ fontSize: '0.75rem' }}>Will sync when online</p>}
          </div>
        )}

        {!success && status?.action === 'checkout' ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem' }}>You are currently checked in.</p>
            <button onClick={handleCheckOut} className="btn btn-danger" style={{ width: '100%' }} disabled={submitting}>
              <LogOut size={18} /> {submitting ? 'Processing...' : 'Check Out'}
            </button>
          </div>
        ) : !success && (
          <form onSubmit={handleCheckIn}>
            <div className="form-group">
              <label className="form-label"><User size={14} style={{ marginRight: '4px' }} />Full Name</label>
              <input className="form-input" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Phone size={14} style={{ marginRight: '4px' }} />Phone Number</label>
              <input className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label"><CreditCard size={14} style={{ marginRight: '4px' }} />ID Number</label>
              <input className="form-input" value={form.id_number} onChange={(e) => setForm({...form, id_number: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label"><FileText size={14} style={{ marginRight: '4px' }} />Purpose of Visit</label>
              <select className="form-input form-select" value={form.purpose} onChange={(e) => setForm({...form, purpose: e.target.value})} required>
                <option value="">Select purpose</option>
                <option value="Meeting">Meeting</option>
                <option value="Delivery">Delivery</option>
                <option value="Interview">Interview</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Personal Visit">Personal Visit</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              <CheckCircle size={18} /> {submitting ? 'Processing...' : 'Check In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
