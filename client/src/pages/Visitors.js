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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#d4ae2a] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Visitor Logs</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <select className="px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:border-[#d4ae2a] focus:outline-none" value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="date" className="px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:border-[#d4ae2a] focus:outline-none" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
          <select className="px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:border-[#d4ae2a] focus:outline-none" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="">All Status</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847] font-medium text-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#1f1f1f]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">Purpose</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">Check In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">Check Out</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#666] uppercase">IP</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr><td colSpan="8" className="text-center text-[#888] py-8">No visitors found</td></tr>
              ) : visitors.map((v) => {
                const checkIn = new Date(v.check_in_time);
                const checkOut = v.check_out_time ? new Date(v.check_out_time) : null;
                const duration = checkOut ? Math.round((checkOut - checkIn) / 60000) : null;
                return (
                  <tr key={v.id} className="border-b border-[#1f1f1f] hover:bg-[#1a1a1a] transition">
                    <td className="px-4 py-3 text-sm font-medium text-white">{v.full_name}</td>
                    <td className="px-4 py-3 text-sm text-[#888]">{v.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(212,174,42,0.08)] text-[#d4ae2a] border border-[#d4ae2a]/20">{v.purpose}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#888]">
                      <div className="flex items-center gap-1">
                        <LogIn size={14} className="text-emerald-400" />
                        {checkIn.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#888]">
                      {checkOut ? (
                        <div className="flex items-center gap-1">
                          <LogOut size={14} className="text-red-400" />
                          {checkOut.toLocaleString()}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#888]">{duration ? `${duration} min` : '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'checked_in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#1f1f1f] text-[#888]'}`}>
                        {v.status === 'checked_in' ? 'In' : 'Out'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#555]">{v.ip_address || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 p-4 border-t border-[#1f1f1f]">
            <button onClick={() => setPagination({...pagination, page: pagination.page - 1})} disabled={pagination.page <= 1} className="px-3 py-1.5 text-sm bg-[#1a1a1a] text-[#888] rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] disabled:opacity-50">Previous</button>
            <span className="text-sm text-[#888]">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setPagination({...pagination, page: pagination.page + 1})} disabled={pagination.page >= pagination.pages} className="px-3 py-1.5 text-sm bg-[#1a1a1a] text-[#888] rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
