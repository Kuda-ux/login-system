import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Plus, Edit, Phone, Mail, Home } from 'lucide-react';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', unit_number: '', rent_amount: '', building_id: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchBuildings(); }, []);
  useEffect(() => { if (selectedBuilding) fetchTenants(); }, [selectedBuilding]);

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings');
      setBuildings(res.data.buildings || []);
      if (res.data.buildings?.length > 0) setSelectedBuilding(res.data.buildings[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get(`/tenants/building/${selectedBuilding}`);
      setTenants(res.data.tenants || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/tenants/${editing}`, form);
      } else {
        await api.post('/tenants', { ...form, building_id: selectedBuilding });
      }
      setShowModal(false); resetForm(); fetchTenants();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
  };

  const resetForm = () => {
    setForm({ full_name: '', email: '', phone: '', unit_number: '', rent_amount: '', building_id: '' });
    setEditing(null);
  };

  const openEdit = (tenant) => {
    setForm({ full_name: tenant.full_name, email: tenant.email || '', phone: tenant.phone, unit_number: tenant.unit_number, rent_amount: tenant.rent_amount });
    setEditing(tenant.id);
    setShowModal(true);
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tenants</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select className="form-input form-select" value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)} style={{ width: 'auto' }}>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
            <Plus size={18} /> Add Tenant
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th>Unit</th><th>Phone</th><th>Rent</th><th>Actions</th></tr></thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No tenants found</td></tr>
              ) : tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{t.full_name}</div>
                    {t.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.email}</div>}
                  </td>
                  <td><span className="badge badge-primary"><Home size={12} /> {t.unit_number}</span></td>
                  <td>{t.phone}</td>
                  <td style={{ fontWeight: 600 }}>${t.rent_amount}</td>
                  <td>
                    <button onClick={() => openEdit(t)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Tenant' : 'Add Tenant'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Unit Number</label>
                  <input className="form-input" value={form.unit_number} onChange={(e) => setForm({...form, unit_number: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Rent Amount ($)</label>
                  <input className="form-input" type="number" value={form.rent_amount} onChange={(e) => setForm({...form, rent_amount: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
