import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Building2, Plus, QrCode, Edit, MapPin, Phone, Mail, Briefcase } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', company_name: '', contact_phone: '', contact_email: '', industry: '', feedback: '' });
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
      setShowModal(false); setForm({ name: '', address: '', company_name: '', contact_phone: '', contact_email: '', industry: '', feedback: '' }); setEditing(null);
      fetchBuildings();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
  };

  const openEdit = (building) => {
    setForm({ name: building.name, address: building.address, company_name: building.company_name || '', contact_phone: building.contact_phone || '', contact_email: building.contact_email || '', industry: building.industry || '', feedback: building.feedback || '' });
    setEditing(building.id);
    setShowModal(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#d4ae2a] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Client Sites</h1>
        <button onClick={() => { setForm({ name: '', address: '', company_name: '', contact_phone: '', contact_email: '', industry: '', feedback: '' }); setEditing(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847] font-medium">
          <Plus size={18} /> Add Client Site
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((b) => (
          <div key={b.id} className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-[#d4ae2a]/50 transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white mb-1">{b.name}</h3>
                {b.company_name && <p className="text-xs text-[#d4ae2a] font-medium mb-1">{b.company_name}</p>}
                <p className="text-sm text-[#888] flex items-center gap-1">
                  <MapPin size={14} /> {b.address}
                </p>
              </div>
              <Building2 size={24} className="text-[#d4ae2a]" />
            </div>
            <div className="mt-3 space-y-1">
              {b.industry && <p className="text-xs text-[#666] flex items-center gap-1"><Briefcase size={12} /> {b.industry}</p>}
              {b.contact_phone && <p className="text-xs text-[#666] flex items-center gap-1"><Phone size={12} /> {b.contact_phone}</p>}
              {b.contact_email && <p className="text-xs text-[#666] flex items-center gap-1"><Mail size={12} /> {b.contact_email}</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowQR(b)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] text-[#888] rounded-lg text-sm hover:bg-[#2a2a2a] border border-[#2a2a2a]">
                <QrCode size={16} /> QR Code
              </button>
              <button onClick={() => openEdit(b)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] text-[#888] rounded-lg text-sm hover:bg-[#2a2a2a] border border-[#2a2a2a]">
                <Edit size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {buildings.length === 0 && (
        <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-12 text-center">
          <Building2 size={48} className="text-[#555] mx-auto mb-4" />
          <p className="text-[#888]">No buildings yet. Add your first building.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{editing ? 'Edit Building' : 'Add Building'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#888] hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Site Name *</label>
                <input className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Westgate Mall" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Company Name</label>
                <input className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none" value={form.company_name} onChange={(e) => setForm({...form, company_name: e.target.value})} placeholder="e.g. Westgate Properties (Pvt) Ltd" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Address *</label>
                <input className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="Full physical address" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Contact Phone</label>
                  <input className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none" value={form.contact_phone} onChange={(e) => setForm({...form, contact_phone: e.target.value})} placeholder="+263..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Contact Email</label>
                  <input className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none" value={form.contact_email} onChange={(e) => setForm({...form, contact_email: e.target.value})} placeholder="client@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Industry</label>
                <select className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:outline-none" value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})}>
                  <option value="">Select industry</option>
                  <option value="Retail">Retail</option>
                  <option value="Corporate Office">Corporate Office</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Residential">Residential</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Government">Government</option>
                  <option value="Mining">Mining</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Financial">Financial</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {editing && (
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-1">Client Feedback / Notes</label>
                  <textarea className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none resize-none" rows="3" value={form.feedback} onChange={(e) => setForm({...form, feedback: e.target.value})} placeholder="Service feedback, special instructions, etc." />
                </div>
              )}
              <button type="submit" className="w-full py-3 bg-[#d4ae2a] text-black rounded-xl font-semibold hover:bg-[#e8c847]">Save</button>
            </form>
          </div>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQR(null)}>
          <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">{showQR.name} - Entry QR Code</h3>
            <div className="inline-block p-4 bg-white rounded-xl">
              <QRCodeSVG value={`${window.location.origin}/visitor/check-in/${showQR.id}`} size={200} />
            </div>
            <p className="mt-4 text-sm text-[#888]">
              Visitors scan this code to check in
            </p>
            <button onClick={() => setShowQR(null)} className="mt-4 px-6 py-2.5 bg-[#d4ae2a] text-black rounded-xl font-medium hover:bg-[#e8c847]">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
