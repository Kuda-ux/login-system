import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Filter, MoreVertical, Mail, Phone, Building2,
  Edit2, Trash2, UserCheck, UserX, Shield, Clock, Calendar, X, QrCode, Download, Key
} from 'lucide-react';
import api from '../../utils/api';

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', phone: '', role: 'staff', building_id: ''
  });
  const [qrModal, setQrModal] = useState(null); // { id, full_name, qr_code }
  const [qrGenerating, setQrGenerating] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null); // { id, full_name }
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, buildingsRes] = await Promise.all([
        api.get('/auth/users?role=staff,security'),
        api.get('/buildings')
      ]);
      setStaff(staffRes.data.users || []);
      setBuildings(buildingsRes.data.buildings || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/auth/users/${editingStaff.id}`, formData);
      } else {
        await api.post('/auth/register', formData);
      }
      setShowModal(false);
      setEditingStaff(null);
      setFormData({ email: '', password: '', full_name: '', phone: '', role: 'staff', building_id: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save staff member');
    }
  };

  const handleEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      email: member.email,
      password: '',
      full_name: member.full_name,
      phone: member.phone || '',
      role: member.role,
      building_id: member.building_id || ''
    });
    setShowModal(true);
  };

  const handleGenerateQR = async (member) => {
    setQrGenerating(true);
    try {
      const res = await api.post(`/staff/generate-qr/${member.id}`);
      setQrModal({ id: member.id, full_name: member.full_name, qr_code: res.data.qr_code });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setQrGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to deactivate staff member');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put(`/auth/users/${passwordModal.id}/password`, { newPassword });
      alert(`Password reset successfully for ${passwordModal.full_name}`);
      setPasswordModal(null);
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = !filterBuilding || member.building_id === filterBuilding;
    return matchesSearch && matchesBuilding;
  });

  const getRoleBadge = (role) => {
    const styles = {
      staff: 'bg-blue-100 text-blue-700',
      security: 'bg-purple-100 text-purple-700',
      admin: 'bg-red-100 text-red-700',
      owner: 'bg-amber-100 text-amber-700'
    };
    return styles[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage your staff and security personnel</p>
        </div>
        <button
          onClick={() => { setEditingStaff(null); setFormData({ email: '', password: '', full_name: '', phone: '', role: 'staff', building_id: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterBuilding}
          onChange={(e) => setFilterBuilding(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All Client Sites</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Staff Members Found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first staff member</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Staff Member
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(member => (
            <div key={member.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {member.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => handleGenerateQR(member)} className="p-1.5 hover:bg-indigo-50 rounded-lg" title="Generate QR Code">
                    <QrCode className="w-4 h-4 text-indigo-500" />
                  </button>
                  <button onClick={() => setPasswordModal({ id: member.id, full_name: member.full_name })} className="p-1.5 hover:bg-amber-50 rounded-lg" title="Reset Password">
                    <Key className="w-4 h-4 text-amber-500" />
                  </button>
                  <button onClick={() => handleEdit(member)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(member.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Deactivate">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.building_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{member.building_name}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(member.created_at).toLocaleDateString()}
                </span>
                <span className={`flex items-center gap-1 ${member.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {member.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {!editingStaff && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required={!editingStaff}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="staff">Staff</option>
                  <option value="security">Guard</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Building</label>
                <select
                  value={formData.building_id}
                  onChange={(e) => setFormData({ ...formData, building_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
                >
                  {editingStaff ? 'Update' : 'Add'} Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setQrModal(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <button onClick={() => setQrModal(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <QrCode className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Staff QR Code</h2>
            <p className="text-gray-500 text-sm mb-4">{qrModal.full_name}</p>
            <div className="bg-gray-50 rounded-xl p-4 inline-block mb-4">
              <img src={qrModal.qr_code} alt="Staff QR Code" className="w-56 h-56 mx-auto" />
            </div>
            <p className="text-gray-400 text-xs mb-4">Security guards scan this code to record staff entry/exit</p>
            <div className="flex gap-3">
              <a
                href={qrModal.qr_code}
                download={`staff-qr-${qrModal.full_name.replace(/\s/g, '-')}.png`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={() => {
                  const w = window.open('', '_blank');
                  w.document.write(`<html><head><title>QR Code - ${qrModal.full_name}</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;"><h2>${qrModal.full_name}</h2><img src="${qrModal.qr_code}" style="width:300px;height:300px;" /><p style="color:#666;">Staff Building Pass</p></body></html>`);
                  w.document.close();
                  w.print();
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setPasswordModal(null); setNewPassword(''); }} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
              <button onClick={() => { setPasswordModal(null); setNewPassword(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Set a new password for <strong>{passwordModal.full_name}</strong>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setPasswordModal(null); setNewPassword(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-medium"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManagement;
