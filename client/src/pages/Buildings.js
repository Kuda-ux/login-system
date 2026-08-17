import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Building2, Plus, QrCode, Edit, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
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
      setShowModal(false); setForm({ name: '', address: '' }); setEditing(null);
      fetchBuildings();
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
  };

  const openEdit = (building) => {
    setForm({ name: building.name, address: building.address });
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
        <button onClick={() => { setForm({ name: '', address: '' }); setEditing(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847] font-medium">
          <Plus size={18} /> Add Client Site
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((b) => (
          <div key={b.id} className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-[#d4ae2a]/50 transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white mb-2">{b.name}</h3>
                <p className="text-sm text-[#888] flex items-center gap-1">
                  <MapPin size={14} /> {b.address}
                </p>
              </div>
              <Building2 size={24} className="text-[#d4ae2a]" />
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Building Name</label>
                <input className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1">Address</label>
                <input className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} required />
              </div>
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
