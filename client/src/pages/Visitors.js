import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserCheck, Search, Download, LogIn, LogOut } from 'lucide-react';

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [filters, setFilters] = useState({ date: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBuildings(); }, []);
  useEffect(() => { if (selectedBuilding) fetchVisitors(); }, [selectedBuilding, filters, pagination.page]);

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings');
      setBuildings(res.data.buildings || []);
      if (res.data.buildings?.length > 0) setSelectedBuilding(res.data.buildings[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchVisitors = async () => {
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: 20 });
      if (filters.date) params.append('date', filters.date);
      if (filters.status) params.append('status', filters.status);
      const res = await api.get(`/visitors/building/${selectedBuilding}?${params}`);
      setVisitors(res.data.visitors || []);
      setPagination(res.data.pagination || { page: 1, total: 0, pages: 0 });
    } catch (err) { console.error(err); }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Phone', 'ID Number', 'Purpose', 'Check In', 'Check Out', 'Status'];
    const rows = visitors.map(v => [v.full_name, v.phone, v.id_number || '***', v.purpose, v.check_in_time, v.check_out_time || '-', v.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `visitors-${filters.date || 'all'}.csv`; a.click();
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Visitor Logs</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-input form-select" value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)} style={{ width: 'auto' }}>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="date" className="form-input" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} style={{ width: 'auto' }} />
          <select className="form-input form-select" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ width: 'auto' }}>
            <option value="">All Status</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
          </select>
          <button onClick={exportCSV} className="btn btn-outline"><Download size={16} /> Export</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Purpose</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Status</th><th>IP</th></tr></thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No visitors found</td></tr>
              ) : visitors.map((v) => {
                const checkIn = new Date(v.check_in_time);
                const checkOut = v.check_out_time ? new Date(v.check_out_time) : null;
                const duration = checkOut ? Math.round((checkOut - checkIn) / 60000) : null;
                return (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.full_name}</td>
                    <td>{v.phone}</td>
                    <td><span className="badge badge-primary">{v.purpose}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LogIn size={14} color="var(--success)" />
                        {checkIn.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      {checkOut ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <LogOut size={14} color="var(--danger)" />
                          {checkOut.toLocaleString()}
                        </div>
                      ) : '-'}
                    </td>
                    <td>{duration ? `${duration} min` : '-'}</td>
                    <td>
                      <span className={`badge ${v.status === 'checked_in' ? 'badge-success' : 'badge-secondary'}`}>
                        {v.status === 'checked_in' ? 'In' : 'Out'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.ip_address || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={() => setPagination({...pagination, page: pagination.page - 1})} disabled={pagination.page <= 1} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Previous</button>
            <span style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setPagination({...pagination, page: pagination.page + 1})} disabled={pagination.page >= pagination.pages} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
