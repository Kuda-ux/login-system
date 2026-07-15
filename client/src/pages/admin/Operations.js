import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, ClipboardCheck, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function Operations() {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/operations/summary'), api.get('/operations/incidents?status=open')])
      .then(([summaryRes, incidentRes]) => {
        setSummary(summaryRes.data);
        setIncidents(incidentRes.data.incidents || []);
      })
      .catch(console.error);
  }, []);

  const cards = [
    { label: 'Guards On Duty', value: summary?.guards_on_duty ?? '—', icon: Users, color: 'text-emerald-400' },
    { label: 'Open Incidents', value: summary?.open_incidents ?? '—', icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Active Patrols', value: summary?.incomplete_patrols ?? '—', icon: ClipboardCheck, color: 'text-indigo-400' },
    { label: 'Visitors On Site', value: summary?.active_visitors ?? '—', icon: ShieldCheck, color: 'text-cyan-400' }
  ];

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-white">Security Operations</h1><p className="text-slate-400 mt-1">Live trial-site control for guards, incidents, patrols and visitors.</p></div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5"><Icon className={`w-6 h-6 ${color}`} /><p className="text-3xl font-bold text-white mt-4">{value}</p><p className="text-sm text-slate-400 mt-1">{label}</p></div>)}</div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6"><div className="flex justify-between items-center mb-5"><div><h2 className="font-semibold text-white">Open Incidents</h2><p className="text-sm text-slate-400">Reports requiring headquarters attention</p></div><Link to="/admin/incidents" className="text-indigo-400 text-sm flex gap-1 items-center">View all <ArrowRight className="w-4 h-4" /></Link></div>{incidents.length ? <div className="space-y-3">{incidents.slice(0, 5).map(incident => <div key={incident.id} className="border border-slate-800 rounded-xl p-3"><div className="flex justify-between gap-3"><p className="font-medium text-white">{incident.title}</p><span className="text-xs uppercase text-amber-300">{incident.severity}</span></div><p className="text-sm text-slate-400 mt-1">{incident.site_name} · {incident.category}</p></div>)}</div> : <p className="text-slate-500 py-8 text-center">No open incidents.</p>}</div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6"><h2 className="font-semibold text-white">Trial workflow</h2><div className="space-y-3 mt-5">{[['1', 'Create guards and complete their e-files'], ['2', 'Assign guards to the trial client site'], ['3', 'Print guard and asset QR labels'], ['4', 'Submit an incident and complete a patrol']].map(([step, text]) => <div className="flex gap-3 text-sm text-slate-300" key={step}><span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">{step}</span>{text}</div>)}</div><div className="flex gap-3 mt-6"><Link to="/admin/guards" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Manage Guards</Link><Link to="/admin/assets" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm">Manage Assets</Link></div></div>
    </div>
  </div>;
}
