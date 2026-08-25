import React, { useEffect, useState } from 'react';
import { Car, Plus, MapPin, X, User, Building2, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm] = useState({
    registration_number: '', make: '', model: '', color: '', assigned_driver_id: '', building_id: ''
  });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [vehiclesRes, buildingsRes, driversRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/buildings'),
        api.get('/auth/users?role=staff,security')
      ]);
      setVehicles(vehiclesRes.data.vehicles || []);
      setBuildings(buildingsRes.data.buildings || []);
      setDrivers(driversRes.data.users || []);
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
      if (selectedVehicle) {
        await api.put(`/vehicles/${selectedVehicle.id}`, form);
        setMessage('Vehicle updated successfully');
      } else {
        await api.post('/vehicles', form);
        setMessage('Vehicle added successfully');
      }
      setShowModal(false);
      setSelectedVehicle(null);
      setForm({ registration_number: '', make: '', model: '', color: '', assigned_driver_id: '', building_id: '' });
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save vehicle');
    }
  };

  const openEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setForm({
      registration_number: vehicle.registration_number || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      color: vehicle.color || '',
      assigned_driver_id: vehicle.assigned_driver_id || '',
      building_id: vehicle.building_id || ''
    });
    setShowModal(true);
  };

  const openNew = () => {
    setSelectedVehicle(null);
    setForm({ registration_number: '', make: '', model: '', color: '', assigned_driver_id: '', building_id: '' });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicle Tracking</h1>
          <p className="text-[#888] mt-1">Manage and track company vehicles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 bg-[#111111] text-[#888] rounded-xl hover:bg-[#1a1a1a] border border-[#1f1f1f]">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847] font-medium">
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-[rgba(212,174,42,0.08)] border border-[#d4ae2a]/30 text-[#d4ae2a] px-4 py-3 rounded-xl">
          {message}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] rounded-2xl p-6 animate-pulse border border-[#1f1f1f]">
              <div className="h-6 bg-[#1f1f1f] rounded w-3/4 mb-4" />
              <div className="h-4 bg-[#1f1f1f] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl p-12 text-center border border-[#1f1f1f]">
          <Car className="w-16 h-16 text-[#555] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Vehicles Registered</h3>
          <p className="text-[#888] mb-6">Add your first vehicle to start tracking</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847]">
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} onClick={() => openEdit(vehicle)} className="bg-[#111111] rounded-2xl p-5 border border-[#1f1f1f] hover:border-[#d4ae2a]/50 cursor-pointer transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[rgba(212,174,42,0.08)] text-[#d4ae2a] flex items-center justify-center">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{vehicle.registration_number}</p>
                    <p className="text-sm text-[#888]">{vehicle.make} {vehicle.model}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${vehicle.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1f1f1f] text-[#888]'}`}>
                  {vehicle.status}
                </span>
              </div>
              
              {vehicle.driver_name && (
                <div className="flex items-center gap-2 text-sm text-[#888] mb-2">
                  <User className="w-4 h-4" />
                  <span>{vehicle.driver_name}</span>
                </div>
              )}
              
              {vehicle.site_name && (
                <div className="flex items-center gap-2 text-sm text-[#888] mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{vehicle.site_name}</span>
                </div>
              )}
              
              {vehicle.last_latitude && vehicle.last_longitude && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 mt-3">
                  <MapPin className="w-4 h-4" />
                  <span>Last seen: {new Date(vehicle.last_location_update).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto my-8 bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{selectedVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button onClick={() => setShowModal(false)}><X className="text-[#888]" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                placeholder="Registration Number *"
                required
                value={form.registration_number}
                onChange={e => setForm({ ...form, registration_number: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  className="px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                  placeholder="Make"
                  value={form.make}
                  onChange={e => setForm({ ...form, make: e.target.value })}
                />
                <input
                  className="px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                  placeholder="Model"
                  value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })}
                />
              </div>
              <input
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#555] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                placeholder="Color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
              />
              <select
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                value={form.assigned_driver_id}
                onChange={e => setForm({ ...form, assigned_driver_id: e.target.value })}
              >
                <option value="">Select Driver (optional)</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              <select
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                value={form.building_id}
                onChange={e => setForm({ ...form, building_id: e.target.value })}
              >
                <option value="">Select Client Site (optional)</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button type="submit" className="w-full py-3 bg-[#d4ae2a] text-black rounded-xl font-semibold hover:bg-[#e8c847]">
                {selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
