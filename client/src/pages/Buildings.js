import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Building2, Plus, QrCode, Edit, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchBuildings(); }, []);

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings');
      setBuildings(res.data.buildings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/buildings/${editing}`, form);
      } else {
        await api.post('/buildings', form);
      }
      setShowModal(false); setForm({ name: '', address: '' }); setEditing(null);
      fetchBuildings();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
  };

  const openEdit = (building) => {
    setForm({ name: building.name, address: building.address });
    setEditing(building.id);
    setShowModal(true);
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Client Sites</h1>
        <button onClick={() => { setForm({ name: '', address: '' }); setEditing(null); setShowModal(true); }} className="btn btn-primary">
          <Plus size={18} /> Add Client Site
        </button>
      </div>

      <div className="grid grid-3">
        {buildings.map((b) => (
          <div key={b.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{b.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {b.address}
                </p>
              </div>
              <Building2 size={24} color="var(--primary)" />
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowQR(b)} className="btn btn-outline" style={{ padding: '0.5rem' }}>
                <QrCode size={16} /> QR Code
              </button>
              <button onClick={() => openEdit(b)} className="btn btn-outline" style={{ padding: '0.5rem' }}>
                <Edit size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {buildings.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Building2 size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No buildings yet. Add your first building.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Building' : 'Add Building'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Building Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save</button>
            </form>
          </div>
        </div>
      )}

      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>{showQR.name} - Entry QR Code</h3>
            <div className="qr-code" style={{ display: 'inline-block', padding: '1rem', background: 'white' }}>
              <QRCodeSVG value={`${window.location.origin}/visitor/check-in/${showQR.id}`} size={200} />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Visitors scan this code to check in
            </p>
            <button onClick={() => setShowQR(null)} className="btn btn-primary" style={{ marginTop: '1rem' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
