import React, { useEffect, useState } from 'react';
import { Shield, Plus, X, User, Building2, RefreshCw, AlertTriangle, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import api from '../../utils/api';

export default function Weapons() {
  const [weapons, setWeapons] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [form, setForm] = useState({
    serial_number: '', weapon_type: '', make: '', model: '', caliber: '', building_id: '', condition_notes: ''
  });
  const [issueForm, setIssueForm] = useState({ guard_id: '', condition_on_issue: '', notes: '' });
  const [returnForm, setReturnForm] = useState({ condition_on_return: '', notes: '' });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [weaponsRes, buildingsRes, guardsRes] = await Promise.all([
        api.get('/weapons'),
        api.get('/buildings'),
        api.get('/auth/users?role=staff,security')
      ]);
      setWeapons(weaponsRes.data.weapons || []);
      setBuildings(buildingsRes.data.buildings || []);
      setGuards(guardsRes.data.users || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedWeapon && !showIssueModal) {
        await api.put(`/weapons/${selectedWeapon.id}`, form);
        setMessage('Weapon updated successfully');
      } else {
        await api.post('/weapons', form);
        setMessage('Weapon registered successfully');
      }
      setShowModal(false);
      setSelectedWeapon(null);
      setForm({ serial_number: '', weapon_type: '', make: '', model: '', caliber: '', building_id: '', condition_notes: '' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save weapon');
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/weapons/${selectedWeapon.id}/issue`, issueForm);
      setMessage('Weapon issued successfully');
      setShowIssueModal(false);
      setSelectedWeapon(null);
      setIssueForm({ guard_id: '', condition_on_issue: '', notes: '' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to issue weapon');
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/weapons/${selectedWeapon.id}/return`, returnForm);
      setMessage('Weapon returned successfully');
      setShowReturnModal(false);
      setSelectedWeapon(null);
      setReturnForm({ condition_on_return: '', notes: '' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to return weapon');
    }
  };

  const openEdit = (weapon) => {
    setSelectedWeapon(weapon);
    setForm({
      serial_number: weapon.serial_number || '',
      weapon_type: weapon.weapon_type || '',
      make: weapon.make || '',
      model: weapon.model || '',
      caliber: weapon.caliber || '',
      building_id: weapon.building_id || '',
      condition_notes: weapon.condition_notes || ''
    });
    setShowModal(true);
  };

  const openIssue = (weapon) => {
    setSelectedWeapon(weapon);
    setIssueForm({ guard_id: '', condition_on_issue: '', notes: '' });
    setShowIssueModal(true);
  };

  const openReturn = (weapon) => {
    setSelectedWeapon(weapon);
    setReturnForm({ condition_on_return: '', notes: '' });
    setShowReturnModal(true);
  };

  const openNew = () => {
    setSelectedWeapon(null);
    setForm({ serial_number: '', weapon_type: '', make: '', model: '', caliber: '', building_id: '', condition_notes: '' });
    setShowModal(true);
  };

  const clearedGuards = guards.filter(g => g.clearance_status === 'cleared');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Weapon Management</h1>
          <p className="text-[#888] mt-1">Track weapons and clearance assignments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 bg-[#1a1a1a] text-[#888] rounded-xl hover:bg-[#2a2a2a]">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847] font-medium">
            <Plus className="w-5 h-5" />
            Register Weapon
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-[rgba(212,174,42,0.08)] border border-[#d4ae2a]/30 text-[#d4ae2a] px-4 py-3 rounded-xl">
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
          <p className="text-2xl font-bold text-white">{weapons.length}</p>
          <p className="text-[#888] text-sm">Total Weapons</p>
        </div>
        <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
          <p className="text-2xl font-bold text-emerald-400">{weapons.filter(w => w.status === 'available').length}</p>
          <p className="text-[#888] text-sm">Available</p>
        </div>
        <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
          <p className="text-2xl font-bold text-[#d4ae2a]">{weapons.filter(w => w.status === 'issued').length}</p>
          <p className="text-[#888] text-sm">Issued</p>
        </div>
        <div className="bg-[#111111] rounded-xl p-4 border border-[#1f1f1f]">
          <p className="text-2xl font-bold text-cyan-400">{clearedGuards.length}</p>
          <p className="text-[#888] text-sm">Cleared Guards</p>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] rounded-2xl p-6 animate-pulse border border-[#1f1f1f]">
              <div className="h-6 bg-[#1f1f1f] rounded w-3/4 mb-4" />
              <div className="h-4 bg-[#1f1f1f] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : weapons.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl p-12 text-center border border-[#1f1f1f]">
          <Shield className="w-16 h-16 text-[#555] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Weapons Registered</h3>
          <p className="text-[#888] mb-6">Register your first weapon to start tracking</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847]">
            <Plus className="w-5 h-5" />
            Register Weapon
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weapons.map(weapon => (
            <div key={weapon.id} className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-[#d4ae2a]/50 transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${weapon.status === 'issued' ? 'bg-[rgba(212,174,42,0.15)] text-[#d4ae2a]' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{weapon.serial_number}</p>
                    <p className="text-sm text-[#888]">{weapon.weapon_type}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${weapon.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' : weapon.status === 'issued' ? 'bg-[rgba(212,174,42,0.15)] text-[#d4ae2a]' : 'bg-[#1f1f1f] text-[#888]'}`}>
                  {weapon.status}
                </span>
              </div>
              
              <p className="text-sm text-[#888] mb-2">{weapon.make} {weapon.model} {weapon.caliber && `(${weapon.caliber})`}</p>
              
              {weapon.holder_name && (
                <div className="flex items-center gap-2 text-sm text-[#d4ae2a] mb-2">
                  <User className="w-4 h-4" />
                  <span>Issued to: {weapon.holder_name}</span>
                  {weapon.holder_clearance !== 'cleared' && (
                    <AlertTriangle className="w-4 h-4 text-red-400" title="Guard clearance issue" />
                  )}
                </div>
              )}
              
              {weapon.site_name && (
                <div className="flex items-center gap-2 text-sm text-[#888] mb-3">
                  <Building2 className="w-4 h-4" />
                  <span>{weapon.site_name}</span>
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(weapon)} className="flex-1 py-2 bg-[#1a1a1a] text-[#888] rounded-lg text-sm hover:bg-[#2a2a2a]">
                  Edit
                </button>
                {weapon.status === 'available' ? (
                  <button onClick={() => openIssue(weapon)} className="flex-1 py-2 bg-[#d4ae2a] text-black rounded-lg text-sm hover:bg-[#e8c847] flex items-center justify-center gap-1">
                    <ArrowRightLeft className="w-4 h-4" /> Issue
                  </button>
                ) : weapon.status === 'issued' ? (
                  <button onClick={() => openReturn(weapon)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Return
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto my-8 bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{selectedWeapon ? 'Edit Weapon' : 'Register Weapon'}</h2>
              <button onClick={() => setShowModal(false)}><X className="text-[#888]" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                placeholder="Serial Number *"
                required
                value={form.serial_number}
                onChange={e => setForm({ ...form, serial_number: e.target.value })}
              />
              <select
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:outline-none"
                required
                value={form.weapon_type}
                onChange={e => setForm({ ...form, weapon_type: e.target.value })}
              >
                <option value="">Select Weapon Type *</option>
                <option value="Pistol">Pistol</option>
                <option value="Revolver">Revolver</option>
                <option value="Shotgun">Shotgun</option>
                <option value="Rifle">Rifle</option>
                <option value="Taser">Taser</option>
                <option value="Baton">Baton</option>
                <option value="Other">Other</option>
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className="px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                  placeholder="Make"
                  value={form.make}
                  onChange={e => setForm({ ...form, make: e.target.value })}
                />
                <input
                  className="px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                  placeholder="Model"
                  value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })}
                />
              </div>
              <input
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                placeholder="Caliber (e.g., 9mm)"
                value={form.caliber}
                onChange={e => setForm({ ...form, caliber: e.target.value })}
              />
              <select
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:outline-none"
                value={form.building_id}
                onChange={e => setForm({ ...form, building_id: e.target.value })}
              >
                <option value="">Select Client Site (optional)</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <textarea
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                placeholder="Condition Notes"
                rows={2}
                value={form.condition_notes}
                onChange={e => setForm({ ...form, condition_notes: e.target.value })}
              />
              <button type="submit" className="w-full py-3 bg-[#d4ae2a] text-black rounded-xl font-semibold hover:bg-[#e8c847]">
                {selectedWeapon ? 'Update Weapon' : 'Register Weapon'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && selectedWeapon && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto my-8 bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Issue Weapon</h2>
              <button onClick={() => setShowIssueModal(false)}><X className="text-[#888]" /></button>
            </div>
            
            <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-[#2a2a2a]">
              <p className="text-white font-semibold">{selectedWeapon.serial_number}</p>
              <p className="text-[#888] text-sm">{selectedWeapon.weapon_type} - {selectedWeapon.make} {selectedWeapon.model}</p>
            </div>

            {clearedGuards.length === 0 ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-4">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                No guards with "Cleared" status. Update guard clearance in Guard E-Files first.
              </div>
            ) : (
              <form onSubmit={handleIssue} className="space-y-4">
                <select
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:outline-none"
                  required
                  value={issueForm.guard_id}
                  onChange={e => setIssueForm({ ...issueForm, guard_id: e.target.value })}
                >
                  <option value="">Select Cleared Guard *</option>
                  {clearedGuards.map(g => <option key={g.id} value={g.id}>{g.full_name}</option>)}
                </select>
                <input
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                  placeholder="Condition on Issue"
                  value={issueForm.condition_on_issue}
                  onChange={e => setIssueForm({ ...issueForm, condition_on_issue: e.target.value })}
                />
                <textarea
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                  placeholder="Notes"
                  rows={2}
                  value={issueForm.notes}
                  onChange={e => setIssueForm({ ...issueForm, notes: e.target.value })}
                />
                <button type="submit" className="w-full py-3 bg-[#d4ae2a] text-black rounded-xl font-semibold hover:bg-[#e8c847]">
                  Issue Weapon
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedWeapon && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto my-8 bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Return Weapon</h2>
              <button onClick={() => setShowReturnModal(false)}><X className="text-[#888]" /></button>
            </div>
            
            <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 border border-[#2a2a2a]">
              <p className="text-white font-semibold">{selectedWeapon.serial_number}</p>
              <p className="text-[#888] text-sm">{selectedWeapon.weapon_type} - {selectedWeapon.make} {selectedWeapon.model}</p>
              <p className="text-[#d4ae2a] text-sm mt-2">Currently held by: {selectedWeapon.holder_name}</p>
            </div>
            
            <form onSubmit={handleReturn} className="space-y-4">
              <input
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                placeholder="Condition on Return"
                value={returnForm.condition_on_return}
                onChange={e => setReturnForm({ ...returnForm, condition_on_return: e.target.value })}
              />
              <textarea
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:outline-none"
                placeholder="Notes"
                rows={2}
                value={returnForm.notes}
                onChange={e => setReturnForm({ ...returnForm, notes: e.target.value })}
              />
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700">
                Confirm Return
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
