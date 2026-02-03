import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CreditCard, Plus, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [form, setForm] = useState({ tenant_id: '', amount: '', rent_month: '', payment_method: 'cash' });

  useEffect(() => { fetchBuildings(); }, []);
  useEffect(() => { if (selectedBuilding) { fetchPayments(); fetchTenants(); } }, [selectedBuilding]);

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings');
      setBuildings(res.data.buildings || []);
      if (res.data.buildings?.length > 0) setSelectedBuilding(res.data.buildings[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/payments/building/${selectedBuilding}`);
      setPayments(res.data.payments || []);
      setTotals(res.data.totals || {});
    } catch (err) { console.error(err); }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get(`/tenants/building/${selectedBuilding}`);
      setTenants(res.data.tenants || []);
    } catch (err) { console.error(err); }
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments/generate', form);
      setShowQR(res.data);
      setShowModal(false);
      fetchPayments();
    } catch (err) { alert(err.response?.data?.error || 'Failed to generate'); }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/manual', form);
      setShowModal(false);
      setForm({ tenant_id: '', amount: '', rent_month: '', payment_method: 'cash' });
      fetchPayments();
    } catch (err) { alert(err.response?.data?.error || 'Failed to record'); }
  };

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Payments</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select className="form-input form-select" value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)} style={{ width: 'auto' }}>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={() => { setForm({ tenant_id: '', amount: '', rent_month: getCurrentMonth(), payment_method: 'cash' }); setShowModal(true); }} className="btn btn-primary">
            <Plus size={18} /> Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>${totals.total_collected || 0}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>${totals.total_pending || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{totals.completed_count || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{totals.pending_count || 0}</div>
          <div className="stat-label">Pending Count</div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Tenant</th><th>Unit</th><th>Amount</th><th>Method</th><th>Month</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No payments found</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.tenant_name}</td>
                  <td>{p.unit_number}</td>
                  <td style={{ fontWeight: 600 }}>${p.amount}</td>
                  <td><span className="badge badge-primary">{p.payment_method}</span></td>
                  <td>{p.rent_month}</td>
                  <td>
                    <span className={`badge ${p.payment_status === 'completed' ? 'badge-success' : p.payment_status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {p.payment_status === 'completed' ? <CheckCircle size={12} /> : <XCircle size={12} />} {p.payment_status}
                    </span>
                  </td>
                  <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</td>
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
              <h3>Record Payment</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">Tenant</label>
                <select className="form-input form-select" value={form.tenant_id} onChange={(e) => setForm({...form, tenant_id: e.target.value})} required>
                  <option value="">Select tenant</option>
                  {tenants.map((t) => <option key={t.id} value={t.id}>{t.full_name} - Unit {t.unit_number}</option>)}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input className="form-input" type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <input className="form-input" type="month" value={form.rent_month} onChange={(e) => setForm({...form, rent_month: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-input form-select" value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})} required>
                  <option value="cash">Cash</option>
                  <option value="ecocash">EcoCash</option>
                  <option value="inbucks">InBucks</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Record Payment</button>
                <button type="button" onClick={handleGenerateQR} className="btn btn-outline"><QrCode size={18} /> Generate QR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Payment QR Code</h3>
            <div style={{ display: 'inline-block', padding: '1rem', background: 'white', borderRadius: '8px' }}>
              <QRCodeSVG value={JSON.stringify({ payment_id: showQR.payment?.id, amount: showQR.payment?.amount, reference: showQR.payment_reference })} size={200} />
            </div>
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>Amount: ${showQR.payment?.amount}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ref: {showQR.payment_reference}</p>
            <button onClick={() => setShowQR(null)} className="btn btn-primary" style={{ marginTop: '1rem' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
