import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, ClipboardCheck, Users, Clock, MapPin, Crosshair, Car, UserCheck, Search, Calendar, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'patrols', label: 'Patrols', icon: ClipboardCheck },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'weapons', label: 'Weapons', icon: Crosshair },
];

export default function Operations() {
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [patrols, setPatrols] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [loading, setLoading] = useState({});
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => { fetchBuildings(); }, []);
  useEffect(() => { loadAll(); }, [selectedBuilding, selectedDate]);

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings');
      setBuildings(res.data.buildings || []);
    } catch (err) { console.error(err); }
  };

  const loadAll = async () => {
    const params = [];
    if (selectedBuilding) params.push(`building_id=${selectedBuilding}`);
    if (selectedDate) params.push(`date=${selectedDate}`);
    const qs = params.length ? `?${params.join('&')}` : '';

    setLoading({ summary: true, patrols: true, incidents: true, attendance: true, vehicles: true, weapons: true });
    try {
      const [sum, pat, inc, att, veh, wep] = await Promise.all([
        api.get('/operations/summary'),
        api.get(`/operations/patrols${qs}`),
        api.get('/operations/incidents'),
        api.get(`/staff/entries-all`),
        api.get('/vehicles'),
        api.get('/weapons')
      ]);
      setSummary(sum.data);
      setPatrols(pat.data.patrols || []);
      setIncidents(inc.data.incidents || []);
      setAttendance(att.data.entries || []);
      setVehicles(veh.data.vehicles || []);
      setWeapons(wep.data.weapons || []);
    } catch (err) {
      console.error('Failed to load operations data:', err);
    } finally {
      setLoading({});
    }
  };

  const cards = [
    { label: 'Guards On Duty', value: summary?.guards_on_duty ?? '—', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { label: 'Open Incidents', value: summary?.open_incidents ?? '—', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { label: 'Active Patrols', value: summary?.incomplete_patrols ?? '—', icon: ClipboardCheck, color: 'text-[#d4ae2a]', bg: 'bg-[rgba(212,174,42,0.08)]' },
    { label: 'Visitors On Site', value: summary?.active_visitors ?? '—', icon: UserCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-5">
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-[#888] mt-1">{label}</p>
        </div>
      ))}</div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-white">Recent Patrols</h2>
            <button onClick={() => setActiveTab('patrols')} className="text-[#d4ae2a] text-sm flex gap-1 items-center">View all</button>
          </div>
          {patrols.slice(0, 5).length ? patrols.slice(0, 5).map(p => (
            <div key={p.id} className="border-b border-[#1f1f1f] last:border-0 py-3">
              <div className="flex justify-between"><p className="font-medium text-white">{p.guard_name}</p><span className={`text-xs uppercase ${p.status === 'in_progress' ? 'text-[#d4ae2a]' : 'text-emerald-400'}`}>{p.status}</span></div>
              <p className="text-sm text-[#888]">{p.site_name} · {p.scans_completed}/{p.total_checkpoints} checkpoints</p>
            </div>
          )) : <p className="text-[#555] py-6 text-center">No patrols recorded.</p>}
        </div>
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-white">Open Incidents</h2>
            <button onClick={() => setActiveTab('incidents')} className="text-[#d4ae2a] text-sm flex gap-1 items-center">View all</button>
          </div>
          {incidents.filter(i => i.status !== 'resolved').slice(0, 5).length ? incidents.filter(i => i.status !== 'resolved').slice(0, 5).map(i => (
            <div key={i.id} className="border-b border-[#1f1f1f] last:border-0 py-3">
              <div className="flex justify-between"><p className="font-medium text-white">{i.title}</p><span className="text-xs uppercase text-amber-300">{i.severity}</span></div>
              <p className="text-sm text-[#888]">{i.site_name} · {i.category}</p>
            </div>
          )) : <p className="text-[#555] py-6 text-center">No open incidents.</p>}
        </div>
      </div>
    </div>
  );

  const renderPatrols = () => (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#1f1f1f] grid grid-cols-6 text-sm font-medium text-[#666] uppercase"><div>Guard</div><div>Site</div><div>Started</div><div>Scans</div><div>Status</div><div>Notes</div></div>
      {patrols.length ? patrols.map(p => (
        <div key={p.id} className="p-4 border-b border-[#1f1f1f] last:border-0 grid grid-cols-6 text-sm items-center hover:bg-[#1a1a1a]">
          <div className="text-white font-medium">{p.guard_name}</div>
          <div className="text-[#888]">{p.site_name}</div>
          <div className="text-[#888]">{new Date(p.started_at).toLocaleString()}</div>
          <div className="text-[#888]">{p.scans_completed}/{p.total_checkpoints}</div>
          <div><span className={`text-xs px-2 py-1 rounded-full ${p.status === 'in_progress' ? 'bg-[rgba(212,174,42,0.08)] text-[#d4ae2a]' : 'bg-emerald-500/20 text-emerald-400'}`}>{p.status}</span></div>
          <div className="text-[#888] truncate" title={p.notes}>{p.notes || '-'}</div>
        </div>
      )) : <div className="p-8 text-center text-[#555]">No patrol records found.</div>}
    </div>
  );

  const renderIncidents = () => (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#1f1f1f] grid grid-cols-6 text-sm font-medium text-[#666] uppercase"><div>Title</div><div>Site</div><div>Category</div><div>Severity</div><div>Status</div><div>Reported</div></div>
      {incidents.length ? incidents.map(i => (
        <div key={i.id} className="p-4 border-b border-[#1f1f1f] last:border-0 grid grid-cols-6 text-sm items-center hover:bg-[#1a1a1a]">
          <div className="text-white font-medium">{i.title}</div>
          <div className="text-[#888]">{i.site_name}</div>
          <div className="text-[#888]">{i.category}</div>
          <div><span className={`text-xs px-2 py-1 rounded-full ${i.severity === 'high' ? 'bg-red-500/20 text-red-400' : i.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1f1f1f] text-[#888]'}`}>{i.severity}</span></div>
          <div><span className={`text-xs px-2 py-1 rounded-full ${i.status === 'open' ? 'bg-[rgba(212,174,42,0.08)] text-[#d4ae2a]' : i.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{i.status}</span></div>
          <div className="text-[#888]">{new Date(i.created_at).toLocaleString()}</div>
        </div>
      )) : <div className="p-8 text-center text-[#555]">No incidents reported.</div>}
    </div>
  );

  const renderAttendance = () => (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#1f1f1f] grid grid-cols-5 text-sm font-medium text-[#666] uppercase"><div>Name</div><div>Site</div><div>Entry</div><div>Exit</div><div>Status</div></div>
      {attendance.length ? attendance.map(a => (
        <div key={a.id} className="p-4 border-b border-[#1f1f1f] last:border-0 grid grid-cols-5 text-sm items-center hover:bg-[#1a1a1a]">
          <div className="text-white font-medium">{a.staff_name}</div>
          <div className="text-[#888]">{a.building_name || a.building_id}</div>
          <div className="text-[#888]">{new Date(a.entry_time).toLocaleString()}</div>
          <div className="text-[#888]">{a.exit_time ? new Date(a.exit_time).toLocaleString() : '-'}</div>
          <div><span className={`text-xs px-2 py-1 rounded-full ${a.status === 'inside' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1f1f1f] text-[#888]'}`}>{a.status}</span></div>
        </div>
      )) : <div className="p-8 text-center text-[#555]">No attendance entries found.</div>}
    </div>
  );

  const renderVehicles = () => (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#1f1f1f] grid grid-cols-6 text-sm font-medium text-[#666] uppercase"><div>Registration</div><div>Make/Model</div><div>Driver</div><div>Site</div><div>Status</div><div>Last Seen</div></div>
      {vehicles.length ? vehicles.map(v => (
        <div key={v.id} className="p-4 border-b border-[#1f1f1f] last:border-0 grid grid-cols-6 text-sm items-center hover:bg-[#1a1a1a]">
          <div className="text-white font-medium">{v.registration_number}</div>
          <div className="text-[#888]">{v.make} {v.model}</div>
          <div className="text-[#888]">{v.driver_name || '-'}</div>
          <div className="text-[#888]">{v.site_name || '-'}</div>
          <div><span className={`text-xs px-2 py-1 rounded-full ${v.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1f1f1f] text-[#888]'}`}>{v.status}</span></div>
          <div className="text-[#888]">{v.last_location_update ? new Date(v.last_location_update).toLocaleString() : '-'}</div>
        </div>
      )) : <div className="p-8 text-center text-[#555]">No vehicles registered.</div>}
    </div>
  );

  const renderWeapons = () => (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#1f1f1f] grid grid-cols-6 text-sm font-medium text-[#666] uppercase"><div>Serial</div><div>Type</div><div>Make/Model</div><div>Holder</div><div>Site</div><div>Status</div></div>
      {weapons.length ? weapons.map(w => (
        <div key={w.id} className="p-4 border-b border-[#1f1f1f] last:border-0 grid grid-cols-6 text-sm items-center hover:bg-[#1a1a1a]">
          <div className="text-white font-medium">{w.serial_number}</div>
          <div className="text-[#888]">{w.weapon_type}</div>
          <div className="text-[#888]">{w.make} {w.model}</div>
          <div className="text-[#888]">{w.holder_name || '-'}</div>
          <div className="text-[#888]">{w.site_name || '-'}</div>
          <div><span className={`text-xs px-2 py-1 rounded-full ${w.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : w.status === 'issued' ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1f1f1f] text-[#888]'}`}>{w.status}</span></div>
        </div>
      )) : <div className="p-8 text-center text-[#555]">No weapons registered.</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Command Center</h1>
          <p className="text-[#888] mt-1">All captured security, patrol, vehicle and weapon activity in one place.</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:border-[#d4ae2a] focus:ring-[rgba(212,174,42,0.15)]" value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
            <option value="">All Sites</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="date" className="px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:border-[#d4ae2a] focus:ring-[rgba(212,174,42,0.15)]" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          <button onClick={loadAll} className="p-2.5 bg-[#111111] text-[#888] rounded-xl hover:bg-[#1a1a1a] border border-[#1f1f1f]"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-[#d4ae2a] text-black' : 'bg-[#111111] text-[#888] hover:bg-[#1a1a1a]'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {loading[activeTab] ? (
        <div className="bg-[#111111] rounded-2xl p-12 border border-[#1f1f1f] text-center"><div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#d4ae2a] border-t-transparent"></div><p className="text-[#888] mt-4">Loading...</p></div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'patrols' && renderPatrols()}
          {activeTab === 'incidents' && renderIncidents()}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'vehicles' && renderVehicles()}
          {activeTab === 'weapons' && renderWeapons()}
        </>
      )}
    </div>
  );
}
