import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Download, Calendar, Building2,
  Users, UserCheck, Clock, FileText, Activity, Shield, ClipboardCheck,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle, User, LogIn, FileSpreadsheet
} from 'lucide-react';
import api from '../../utils/api';

const API_BASE = api.defaults.baseURL;

const TABS = [
  { id: 'patrols', label: 'Guard Patrols', icon: Shield },
  { id: 'guards', label: 'Guard Activity', icon: User },
  { id: 'attendance', label: 'Attendance & Exports', icon: FileSpreadsheet },
  { id: 'logins', label: 'Login Activity', icon: LogIn },
  { id: 'overview', label: 'Overview', icon: BarChart3 },
];

function Reports() {
  const [activeTab, setActiveTab] = useState('patrols');
  const [stats, setStats] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [guards, setGuards] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedGuard, setSelectedGuard] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [visitorData, setVisitorData] = useState([]);
  const [patrolReport, setPatrolReport] = useState(null);
  const [guardLog, setGuardLog] = useState(null);
  const [missedReport, setMissedReport] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginPagination, setLoginPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loginFilter, setLoginFilter] = useState('all');

  useEffect(() => { fetchBuildings(); }, []);
  useEffect(() => { fetchOverview(); }, [selectedBuilding]);
  useEffect(() => { fetchPatrolReport(); }, [reportDate, selectedBuilding]);
  useEffect(() => { if (selectedGuard) fetchGuardLog(); }, [selectedGuard, startDate, endDate]);
  useEffect(() => { if (activeTab === 'logins') fetchLoginLogs(); }, [activeTab, loginFilter]);

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
      const [statsRes, visitorsRes] = await Promise.all([
        api.get(`/dashboard/stats${params}`),
        api.get(`/dashboard/charts/visitors?days=30${selectedBuilding ? `&building_id=${selectedBuilding}` : ''}`)
      ]);
      setStats(statsRes.data);
      setVisitorData(visitorsRes.data.data || []);
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

      let missedUrl = `/operations/patrol-reports/missed?date=${reportDate}`;
      if (selectedBuilding) missedUrl += `&building_id=${selectedBuilding}`;
      const missedRes = await api.get(missedUrl);
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

  const fetchLoginLogs = async (page = 1) => {
    try {
      let url = `/auth/login-logs?page=${page}&limit=50`;
      if (loginFilter !== 'all') url += `&status=${loginFilter}`;
      const res = await api.get(url);
      setLoginLogs(res.data.logs || []);
      setLoginPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch login logs:', err);
    }
  };

  // Excel export helper - downloads file from API
  const downloadExcel = async (endpoint, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/exports/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download export. Please try again.');
    }
  };

  const exportVisitorLog = () => {
    let params = [];
    if (selectedBuilding) params.push(`building_id=${selectedBuilding}`);
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    const query = params.length ? `?${params.join('&')}` : '';
    downloadExcel(`visitors${query}`, `Visitor_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportStaffAttendance = () => {
    let params = [];
    if (selectedBuilding) params.push(`building_id=${selectedBuilding}`);
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    const query = params.length ? `?${params.join('&')}` : '';
    downloadExcel(`staff-attendance${query}`, `Staff_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportGuardLogSheet = () => {
    let params = [];
    if (selectedBuilding) params.push(`building_id=${selectedBuilding}`);
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    const query = params.length ? `?${params.join('&')}` : '';
    downloadExcel(`guard-logsheet${query}`, `Guard_LogSheet_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportLoginActivity = () => {
    let params = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    if (loginFilter !== 'all') params.push(`status=${loginFilter}`);
    const query = params.length ? `?${params.join('&')}` : '';
    downloadExcel(`login-logs${query}`, `Login_Activity_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const StatCard = ({ icon: Icon, label, value, color, prefix = '' }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );

  const maxVisitors = Math.max(...visitorData.map(d => d.count), 1);

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
          <StatCard icon={AlertTriangle} label="Open Incidents" value={stats?.open_incidents || 0} color="bg-amber-100 text-amber-600" />
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Visitor Trend (30 days)</h3>
        {visitorData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400"><BarChart3 className="w-12 h-12 mb-2 opacity-50" /><p>No visitor data</p></div>
        ) : (
          <div className="h-48 flex items-end gap-1">
            {visitorData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all" style={{ height: `${(d.count / maxVisitors) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }} title={`${d.date}: ${d.count} visitors`} />
                {i % 3 === 0 && <span className="text-[10px] text-gray-400 truncate w-full text-center">{new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
              </div>
            ))}
          </div>
        )}
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
        <div className="flex gap-2 flex-wrap">
          <input type="date" className="px-3 py-2 border border-gray-200 rounded-xl text-sm" value={reportDate} onChange={e => setReportDate(e.target.value)} />
          <select className="px-3 py-2 border border-gray-200 rounded-xl text-sm" value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
            <option value="">All Sites</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
          <div className="col-span-3">Guard</div>
          <div className="col-span-2">Site</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Completed</div>
          <div className="col-span-2">Last Patrol</div>
          <div className="col-span-1">Action</div>
        </div>
        {patrolReport?.guards?.length ? patrolReport.guards.map(g => (
          <div key={g.guard_id} className="p-4 border-b border-gray-50 last:border-0 grid grid-cols-12 text-sm items-center hover:bg-gray-50 transition">
            <div className="col-span-3 font-medium text-gray-900">{g.guard_name}</div>
            <div className="col-span-2 text-gray-500 text-xs">{g.site_name || '-'}</div>
            <div className="col-span-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${g.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : g.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>
                {g.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : g.status === 'in_progress' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {g.status.replace('_', ' ')}
              </span>
            </div>
            <div className="col-span-2 text-gray-600 font-mono text-xs">{g.completed_count} / {g.total_patrols}</div>
            <div className="col-span-2 text-gray-500 text-xs">{g.last_patrol_at ? new Date(g.last_patrol_at).toLocaleString() : '-'}</div>
            <div className="col-span-1">
              <button onClick={() => { setSelectedGuard(g.guard_id); setActiveTab('guards'); }} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium">
                View <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )) : <div className="p-8 text-center text-gray-500">No guard patrol data for the selected date.</div>}
      </div>

      {missedReport?.missed_guards?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="font-semibold text-red-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Missed Patrols ({missedReport.missed_count})</h3>
          <p className="text-red-700 text-sm mt-2">Completion rate: {missedReport.completion_rate}%</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {missedReport.missed_guards.map(g => (
              <span key={g.id} className="bg-white text-red-700 px-3 py-1.5 rounded-full text-sm border border-red-200 font-medium">{g.full_name} ({g.site_name || 'No site'})</span>
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
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <select className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm" value={selectedGuard} onChange={e => setSelectedGuard(e.target.value)}>
          <option value="">Select a guard</option>
          {guards.map(g => <option key={g.id} value={g.id}>{g.full_name} — {g.site_name || 'No Site'}</option>)}
        </select>
        <input type="date" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input type="date" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {selectedGuard && guardLog && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ClipboardCheck} label="Total Patrols" value={guardLog.summary.total_patrols} color="bg-blue-100 text-blue-600" />
            <StatCard icon={CheckCircle2} label="Completed" value={guardLog.summary.completed} color="bg-emerald-100 text-emerald-600" />
            <StatCard icon={Clock} label="In Progress" value={guardLog.summary.in_progress} color="bg-indigo-100 text-indigo-600" />
            <StatCard icon={Activity} label="Total Scans" value={guardLog.summary.total_scans} color="bg-purple-100 text-purple-600" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Completed</div>
              <div className="col-span-2">Site</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Checkpoints</div>
              <div className="col-span-2">Notes</div>
            </div>
            {guardLog.patrols.length ? guardLog.patrols.map(p => (
              <div key={p.id} className="p-4 border-b border-gray-50 last:border-0 grid grid-cols-12 text-sm items-center">
                <div className="col-span-2 text-gray-500 text-xs">{new Date(p.started_at).toLocaleString()}</div>
                <div className="col-span-2 text-gray-500 text-xs">{p.completed_at ? new Date(p.completed_at).toLocaleString() : '-'}</div>
                <div className="col-span-2 text-gray-900 font-medium text-xs">{p.site_name}</div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{p.status}</span>
                </div>
                <div className="col-span-2 text-gray-600 font-mono text-xs">{p.scans_completed}/{p.total_checkpoints}</div>
                <div className="col-span-2 text-gray-500 text-xs truncate" title={p.notes}>{p.notes || '-'}</div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No patrol activity for this guard in the selected range.</div>}
          </div>

          {guardLog.scans.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Scan Activity ({guardLog.scans.length})</h3>
              </div>
              <div className="p-4 border-b border-gray-100 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                <div className="col-span-3">Asset/Checkpoint</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Condition</div>
                <div className="col-span-2">Scanned At</div>
                <div className="col-span-2">Notes</div>
              </div>
              {guardLog.scans.map(s => (
                <div key={s.id} className="p-4 border-b border-gray-50 last:border-0 grid grid-cols-12 text-sm items-center">
                  <div className="col-span-3 text-gray-900 font-medium text-xs">{s.asset_name} <span className="text-gray-400">({s.asset_code})</span></div>
                  <div className="col-span-3 text-gray-500 text-xs">{s.location || '-'}</div>
                  <div className="col-span-2"><span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">{s.condition_status}</span></div>
                  <div className="col-span-2 text-gray-500 text-xs">{new Date(s.scanned_at).toLocaleString()}</div>
                  <div className="col-span-2 text-gray-500 text-xs truncate" title={s.notes}>{s.notes || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderAttendanceExports = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Attendance & Log Sheet Exports</h2>
        <p className="text-gray-500 mt-1">Export visitor logs, staff attendance, and guard log sheets to Excel.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900">Export Filters</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Client Site</label>
            <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
              <option value="">All Sites</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-xs text-gray-400 italic">Records are kept permanently. Adjust date range to filter.</p>
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Visitor Log Export */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <UserCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Visitor Log</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Full visitor check-in/out records with names, IDs, timestamps, duration, and site info.</p>
          <button
            onClick={exportVisitorLog}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>

        {/* Staff Attendance Export */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Staff Attendance</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Clock-in/out records for all staff with hours worked, site name, and notes.</p>
          <button
            onClick={exportStaffAttendance}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>

        {/* Guard Log Sheet Export */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Guard Log Sheet</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Guard summary: Name, Site, Timestamps, Days Worked (30-day), and Status.</p>
          <button
            onClick={exportGuardLogSheet}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900">Long-Term Record Keeping</h4>
            <p className="text-blue-700 text-sm mt-1">All attendance, visitor, and patrol records are stored permanently in the system. No records are ever automatically deleted. Use the date filters above to export specific periods.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoginActivity = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Login Activity</h2>
          <p className="text-gray-500 mt-1">Track who logged into the system, when, and from where.</p>
        </div>
        <button
          onClick={exportLoginActivity}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'success', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setLoginFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${loginFilter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {f === 'all' ? 'All Logins' : f === 'success' ? 'Successful' : 'Failed'}
          </button>
        ))}
      </div>

      {/* Login Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
          <div className="col-span-3">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Login Time</div>
          <div className="col-span-2">IP Address</div>
          <div className="col-span-2">Status</div>
        </div>
        {loginLogs.length ? loginLogs.map((log, i) => (
          <div key={log.id || i} className="p-4 border-b border-gray-50 last:border-0 grid grid-cols-12 text-sm items-center hover:bg-gray-50 transition">
            <div className="col-span-3">
              <p className="font-medium text-gray-900 text-xs">{log.full_name || 'Unknown'}</p>
              <p className="text-gray-400 text-[11px]">{log.email}</p>
            </div>
            <div className="col-span-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 capitalize">{log.role || 'N/A'}</span>
            </div>
            <div className="col-span-3 text-gray-600 text-xs">{log.login_at ? new Date(log.login_at).toLocaleString() : ''}</div>
            <div className="col-span-2 text-gray-500 text-xs font-mono">{log.ip_address || '-'}</div>
            <div className="col-span-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {log.status}
              </span>
            </div>
          </div>
        )) : <div className="p-8 text-center text-gray-500">No login activity recorded yet.</div>}
      </div>

      {/* Pagination */}
      {loginPagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {loginLogs.length} of {loginPagination.total} records</p>
          <div className="flex gap-2">
            <button
              disabled={loginPagination.page <= 1}
              onClick={() => fetchLoginLogs(loginPagination.page - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">Page {loginPagination.page} of {loginPagination.pages}</span>
            <button
              disabled={loginPagination.page >= loginPagination.pages}
              onClick={() => fetchLoginLogs(loginPagination.page + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive reporting, patrol accountability, and exportable logs.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'patrols' && renderPatrols()}
      {activeTab === 'guards' && renderGuardActivity()}
      {activeTab === 'attendance' && renderAttendanceExports()}
      {activeTab === 'logins' && renderLoginActivity()}
    </div>
  );
}

export default Reports;
