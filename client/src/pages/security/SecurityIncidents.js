import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const blank = { building_id: '', title: '', category: 'Access breach', severity: 'medium', description: '', people_involved: '', actions_taken: '' };

export default function SecurityIncidents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [siteRes, incidentRes] = await Promise.all([
        api.get('/buildings'),
        api.get('/operations/incidents')
      ]);
      setSites(siteRes.data.buildings || []);
      setIncidents(incidentRes.data.incidents || []);
      // Auto-select the supervisor's building if they have one
      if (user?.building_id && !form.building_id) {
        setForm(f => ({ ...f, building_id: user.building_id }));
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/operations/incidents', form);
      setForm({ ...blank, building_id: form.building_id });
      setMessage('Incident report submitted to headquarters.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to submit report');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.put(`/operations/incidents/${id}/status`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed');
    }
  };

  const getSeverityColor = (sev) => {
    const colors = { low: 'text-blue-400 bg-blue-500/10', medium: 'text-amber-400 bg-amber-500/10', high: 'text-orange-400 bg-orange-500/10', critical: 'text-red-400 bg-red-500/10' };
    return colors[sev] || colors.medium;
  };

  const getStatusIcon = (status) => {
    if (status === 'resolved') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (status === 'closed') return <XCircle className="w-4 h-4 text-[#666]" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111111] border-b border-[#1f1f1f] p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/security')} className="p-2.5 bg-[#1a1a1a] rounded-xl hover:bg-[#2a2a2a] transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-white text-lg">Incident Reports</h1>
            <p className="text-xs text-[#888]">Submit and track incident reports</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* New Incident Form */}
        <form onSubmit={submit} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#d4ae2a]" />
            <h2 className="font-semibold text-white text-lg">Report New Incident</h2>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm ${message.includes('submitted') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">Client Site</label>
            <select
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:outline-none"
              required
              value={form.building_id}
              onChange={e => setForm({ ...form, building_id: e.target.value })}
            >
              <option value="">Select client site</option>
              {sites.map(site => <option value={site.id} key={site.id}>{site.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">Incident Title</label>
            <input
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
              required
              placeholder="Brief title describing the incident"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Category</label>
              <select className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:outline-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['Access breach', 'Theft', 'Trespass', 'Injury', 'Property damage', 'Fire', 'Other'].map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#888] mb-1.5">Severity</label>
              <select className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:outline-none" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {['low', 'medium', 'high', 'critical'].map(x => <option key={x} value={x} className="capitalize">{x}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">Full Description</label>
            <textarea
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none min-h-28 resize-none"
              required
              placeholder="Describe what happened in detail..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">People Involved (optional)</label>
            <textarea
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none min-h-16 resize-none"
              placeholder="Names of people involved, if any"
              value={form.people_involved}
              onChange={e => setForm({ ...form, people_involved: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#888] mb-1.5">Immediate Action Taken (optional)</label>
            <textarea
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none min-h-16 resize-none"
              placeholder="What did you do in response?"
              value={form.actions_taken}
              onChange={e => setForm({ ...form, actions_taken: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#d4ae2a] text-black font-semibold rounded-xl hover:bg-[#e8c847] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black" /> : <><AlertTriangle className="w-5 h-5" /> Submit Report</>}
          </button>
        </form>

        {/* Incident History */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#d4ae2a]" />
            <h2 className="font-semibold text-white text-lg">Incident History</h2>
            <span className="ml-auto text-sm text-[#666]">{incidents.length} reports</span>
          </div>

          {incidents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-[#333]" />
              <p className="text-[#666]">No incidents reported yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map(inc => {
                const site = sites.find(s => s.id === inc.building_id);
                return (
                  <div key={inc.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{inc.title}</h3>
                        <p className="text-xs text-[#666] mt-0.5">{site?.name || 'Unknown site'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getSeverityColor(inc.severity)}`}>
                          {inc.severity}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#888] capitalize">
                          {getStatusIcon(inc.status)}
                          {inc.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#888] line-clamp-2 mb-2">{inc.description}</p>
                    <div className="flex items-center justify-between text-xs text-[#555]">
                      <span>{inc.category}</span>
                      <span>{new Date(inc.occurred_at || inc.created_at).toLocaleString()}</span>
                    </div>
                    {inc.status === 'open' && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => setStatus(inc.id, 'resolved')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition">
                          Mark Resolved
                        </button>
                        <button onClick={() => setStatus(inc.id, 'closed')} className="px-3 py-1.5 bg-[#1a1a1a] text-[#888] rounded-lg text-xs font-medium hover:bg-[#2a2a2a] transition">
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
