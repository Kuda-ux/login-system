import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Download, Calendar, Building2,
  Users, UserCheck, DollarSign, Clock, FileText, Activity, Shield, ClipboardCheck,
  Search, ChevronRight, AlertTriangle, CheckCircle2, XCircle, ArrowRight, User
} from 'lucide-react';
import api from '../../utils/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'patrols', label: 'Guard Patrols', icon: Shield },
  { id: 'guards', label: 'Guard Activity', icon: User },
];

function Reports() {
  const [activeTab, setActiveTab] = useState('patrols');
  const [stats, setStats] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [guards, setGuards] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedGuard, setSelectedGuard] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [visitorData, setVisitorData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [patrolReport, setPatrolReport] = useState(null);
  const [guardLog, setGuardLog] = useState(null);
  const [missedReport, setMissedReport] = useState(null);

  useEffect(() => { fetchBuildings(); }, []);
  useEffect(() => { fetchOverview(); }, [selectedBuilding]);
  useEffect(() => { fetchPatrolReport(); }, [reportDate, selectedBuilding]);
  useEffect(() => { if (selectedGuard) fetchGuardLog(); }, [selectedGuard, startDate, endDate]);

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings');
      setBuildings(res.data.buildings || []);
      const guardsRes = await api.get('/operations/guards');
      setGuards(guardsRes.data.guards || []);
    } catch (err) { console.error(err); }
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const params = selectedBuilding ? `?building_id=${selectedBuilding}` : '';
      const [statsRes, visitorsRes, revenueRes] = await Promise.all([
        api.get(`/dashboard/stats${params}`),
        api.get(`/dashboard/charts/visitors?days=30${selectedBuilding ? `&building_id=${selectedBuilding}` : ''}`),
        api.get(`/dashboard/charts/revenue?months=6${selectedBuilding ? `&building_id=${selectedBuilding}` : ''}`)
      ]);
      setStats(statsRes.data);
      setVisitorData(visitorsRes.data.data || []);
      setRevenueData(revenueRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatrolReport = async () => {
    try {
      let url = `/operations/patrol-reports/accountability?date=${reportDate}`;
      if (selectedBuilding) url += `&building_id=${selectedBuilding}`;
      const res = await api.get(url);
      setPatrolReport(res.data);

      const missedRes = await api.get(url.replace('/patrols/report', '/patrol-reports/missed'));
      setMissedReport(missedRes.data);
    } catch (err) {
      console.error('Failed to fetch patrol report:', err);
    }
  };

  const fetchGuardLog = async () => {
    try {
      let url = `/operations/patrol-reports/guard/${selectedGuard}`;
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length) url += `?${params.join('&')}`;
      const res = await api.get(url);
      setGuardLog(res.data);
    } catch (err) {
      console.error('Failed to fetch guard log:', err);
    }
  };

  const exportReport = (type) => {
    let data, filename;
    if (type === 'patrol') {
      data = patrolReport;
      filename = `patrol-report-${reportDate}.json`;
    } else if (type === 'guard') {
      data = guardLog;
      filename = `guard-log-${selectedGuard}.json`;
    } else {
      data = { generatedAt: new Date().toISOString(), stats, visitorTrend: visitorData, revenueTrend: revenueData };
      filename = `overview-report-${new Date().toISOString().split('T')[0]}.json`;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const exportCSV = (rows, headers, filename) => {
    const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

  const StatCard = ({ icon: Icon, label, value, color, prefix = '' }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );

  const maxVisitors = Math.max(...visitorData.map(d => d.count), 1);
  const maxRevenue = Math.max(...revenueData.map(d => d.total), 1);

  const renderOverview = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl p-6 animate-pulse"><div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" /><div className="h-8 bg-gray-200 rounded w-20 mb-2" /><div className="h-4 bg-gray-200 rounded w-32" /></div>)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Client Sites" value={stats?.total_buildings || 0} color="bg-blue-100 text-blue-600" />
          <StatCard icon={UserCheck} label="Visitors On Site" value={stats?.active_visitors || 0} color="bg-green-100 text-green-600" />
          <StatCard icon={Users} label="Guards/Staff" value={stats?.total_staff || 0} color="bg-purple-100 text-purple-600" />
          <StatCard icon={DollarSign} label="Open Incidents" value={stats?.open_incidents || 0} color="bg-amber-100 text-amber-600" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Visitor Trend (30 days)</h3>
          {visitorData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400"><BarChart3 className="w-12 h-12 mb-2 opacity-50" /><p>No visitor data</p></div>
          ) : (
            <div className="h-48 flex items-end gap-1">
              {visitorData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg" style={{ height: `${(d.count / maxVisitors) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }} title={`${d.date}: ${d.count} visitors`} />
                  <span className="text-xs text-gray-400 truncate w-full text-center">{new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (6 months)</h3>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400"><TrendingUp className="w-12 h-12 mb-2 opacity-50" /><p>No revenue data</p></div>
          ) : (
            <div className="h-48 flex items-end gap-1">
              {revenueData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg" style={{ height: `${(d.total / maxRevenue) * 100}%`, minHeight: d.total > 0 ? '8px' : '2px' }} title={`${d.month}: $${d.total}`} />
                  <span className="text-xs text-gray-400 truncate w-full text-center">{d.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPatrols = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Guard Patrol Accountability</h2>
          <p className="text-gray-500 mt-1">Track completed, in-progress, and missed patrols by guard.</p>
        </div>
        <div className="flex gap-2">
          <input type="date" className="px-3 py-2 border border-gray-200 rounded-xl" value={reportDate} onChange={e => setReportDate(e.target.value)} />
          <button onClick={() => exportCSV(
            (patrolReport?.guards || []).map(g => [g.guard_name, g.site_name, g.status, g.completed_count, g.last_patrol_at ? new Date(g.last_patrol_at).toLocaleString() : '']),
            ['Guard Name', 'Site', 'Status', 'Completed Patrols', 'Last Patrol'],
            `patrol-accountability-${reportDate}.csv`
          )} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><Download className="w-4 h-4" />Export</button>
        </div>
      </div>

      {patrolReport?.summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Guards" value={patrolReport.summary.total_guards} color="bg-blue-100 text-blue-600" />
          <StatCard icon={CheckCircle2} label="Completed" value={patrolReport.summary.completed} color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={Clock} label="In Progress" value={patrolReport.summary.in_progress} color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={XCircle} label="Missed" value={patrolReport.summary.missed} color="bg-red-100 text-red-600" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 grid grid-cols-12 text-sm font-medium text-gray-500 bg-gray-50">
          <div className="col-span-3">Guard</div>
          <div className="col-span-2">Site</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Completed</div>
          <div className="col-span-2">Last Patrol</div>
          <div className="col-span-1">Action</div>
        </div>
        {patrolReport?.guards?.length ? patrolReport.guards.map(g => (
          <div key={g.guard_id} className="p-4 border-b border-gray-100 last:border-0 grid grid-cols-12 text-sm items-center hover:bg-gray-50">
            <div className="col-span-3 font-medium text-gray-900">{g.guard_name}</div>
            <div className="col-span-2 text-gray-500">{g.site_name || '-'}</div>
            <div className="col-span-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${g.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : g.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>
                {g.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : g.status === 'in_progress' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {g.status.replace('_', ' ')}
              </span>
            </div>
            <div className="col-span-2 text-gray-500">{g.completed_count} / {g.total_patrols}</div>
            <div className="col-span-2 text-gray-500">{g.last_patrol_at ? new Date(g.last_patrol_at).toLocaleString() : '-'}</div>
            <div className="col-span-1">
              <button onClick={() => { setSelectedGuard(g.guard_id); setActiveTab('guards'); }} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium">
                View <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )) : <div className="p-8 text-center text-gray-500">No guard patrol data for the selected date.</div>}
      </div>

      {missedReport?.missed_guards?.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <h3 className="font-semibold text-red-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Missed Patrols ({missedReport.missed_count})</h3>
          <p className="text-red-700 text-sm mt-2">Completion rate: {missedReport.completion_rate}%</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {missedReport.missed_guards.map(g => (
              <span key={g.id} className="bg-white text-red-700 px-3 py-1 rounded-full text-sm border border-red-100">{g.full_name} ({g.site_name || 'No site'})</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderGuardActivity = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Individual Guard Activity Log</h2>
          <p className="text-gray-500 mt-1">Detailed patrol history, timestamps, and scan activity per guard.</p>
        </div>
        {guardLog && <button onClick={() => exportReport('guard')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"><Download className="w-4 h-4" />Export Log</button>}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100">
        <select className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl" value={selectedGuard} onChange={e => setSelectedGuard(e.target.value)}>
          <option value="">Select a guard</option>
          {guards.map(g => <option key={g.id} value={g.id}>{g.full_name} — {g.site_name}</option>)}
        </select>
        <input type="date" className="px-4 py-2.5 border border-gray-200 rounded-xl" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Start date" />
        <input type="date" className="px-4 py-2.5 border border-gray-200 rounded-xl" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="End date" />
      </div>

      {selectedGuard && guardLog && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ClipboardCheck} label="Total Patrols" value={guardLog.summary.total_patrols} color="bg-blue-100 text-blue-600" />
            <StatCard icon={CheckCircle2} label="Completed" value={guardLog.summary.completed} color="bg-emerald-100 text-emerald-600" />
            <StatCard icon={Clock} label="In Progress" value={guardLog.summary.in_progress} color="bg-indigo-100 text-indigo-600" />
            <StatCard icon={Activity} label="Total Scans" value={guardLog.summary.total_scans} color="bg-purple-100 text-purple-600" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 grid grid-cols-12 text-sm font-medium text-gray-500 bg-gray-50">
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Completed</div>
              <div className="col-span-2">Site</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Checkpoints</div>
              <div className="col-span-2">Notes</div>
            </div>
            {guardLog.patrols.length ? guardLog.patrols.map(p => (
              <div key={p.id} className="p-4 border-b border-gray-100 last:border-0 grid grid-cols-12 text-sm items-center">
                <div className="col-span-2 text-gray-500">{new Date(p.started_at).toLocaleString()}</div>
                <div className="col-span-2 text-gray-500">{p.completed_at ? new Date(p.completed_at).toLocaleString() : '-'}</div>
                <div className="col-span-2 text-gray-900 font-medium">{p.site_name}</div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{p.status}</span>
                </div>
                <div className="col-span-2 text-gray-500">{p.scans_completed}/{p.total_checkpoints}</div>
                <div className="col-span-2 text-gray-500 truncate" title={p.notes}>{p.notes || '-'}</div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No patrol activity for this guard in the selected range.</div>}
          </div>

          {guardLog.scans.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Scan Activity ({guardLog.scans.length})</h3>
              </div>
              <div className="p-4 border-b border-gray-100 grid grid-cols-12 text-sm font-medium text-gray-500 bg-gray-50">
                <div className="col-span-3">Asset/Checkpoint</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Condition</div>
                <div className="col-span-2">Scanned At</div>
                <div className="col-span-2">Notes</div>
              </div>
              {guardLog.scans.map(s => (
                <div key={s.id} className="p-4 border-b border-gray-100 last:border-0 grid grid-cols-12 text-sm items-center">
                  <div className="col-span-3 text-gray-900 font-medium">{s.asset_name} <span className="text-gray-400 font-normal">({s.asset_code})</span></div>
                  <div className="col-span-3 text-gray-500">{s.location || '-'}</div>
                  <div className="col-span-2"><span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{s.condition_status}</span></div>
                  <div className="col-span-2 text-gray-500">{new Date(s.scanned_at).toLocaleString()}</div>
                  <div className="col-span-2 text-gray-500 truncate" title={s.notes}>{s.notes || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Overview and guard patrol accountability reports.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'patrols' && renderPatrols()}
      {activeTab === 'guards' && renderGuardActivity()}
    </div>
  );
}

export default Reports;
