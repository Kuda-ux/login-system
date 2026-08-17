import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, User, Lock, Bell, Palette, Globe, 
  Shield, Save, Eye, EyeOff, Check, AlertCircle, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    visitorAlerts: true,
    paymentReminders: true,
    weeklyReports: false
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/auth/profile', profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#888] mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            <div className="p-4 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#d4ae2a] to-[#b8941f] rounded-full flex items-center justify-center text-black font-semibold text-lg">
                  {user?.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{user?.full_name}</p>
                  <p className="text-sm text-[#888] capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
            <nav className="p-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMessage({ type: '', text: '' }); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left ${
                    activeTab === tab.id
                      ? 'bg-[rgba(212,174,42,0.08)] text-[#d4ae2a] font-medium'
                      : 'text-[#888] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847] transition font-medium disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#888]"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#888]"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#888]"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#d4ae2a] text-black rounded-xl hover:bg-[#e8c847] transition font-medium disabled:opacity-50"
                  >
                    <Lock className="w-5 h-5" />
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-8 border-t border-[#1f1f1f]">
                <h3 className="font-semibold text-white mb-4">Security Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl">
                    <span className="text-[#888]">Role</span>
                    <span className="font-medium text-white capitalize">{user?.role}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl">
                    <span className="text-[#888]">Account Status</span>
                    <span className="flex items-center gap-2 font-medium text-green-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important updates via email' },
                  { key: 'visitorAlerts', label: 'Visitor Alerts', desc: 'Get notified when visitors check in' },
                  { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Reminders for pending rent payments' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly summary reports' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-xl">
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-[#888]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className={`relative w-12 h-6 rounded-full transition ${
                        notifications[item.key] ? 'bg-[#d4ae2a]' : 'bg-[#2a2a2a]'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifications[item.key] ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#555] mt-6">
                Note: Notification settings are stored locally and will be synced when backend support is available.
              </p>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="bg-[#111111] rounded-2xl border border-[#1f1f1f] p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Appearance Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Light', 'Dark', 'System'].map(theme => (
                      <button
                        key={theme}
                        className={`p-4 rounded-xl border-2 transition ${
                          theme === 'Dark' 
                            ? 'border-[#d4ae2a] bg-[rgba(212,174,42,0.08)]' 
                            : 'border-[#2a2a2a] hover:border-[#555]'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg mb-2 ${
                          theme === 'Dark' ? 'bg-[#0a0a0a]' : theme === 'System' ? 'bg-gradient-to-r from-[#333] to-[#0a0a0a]' : 'bg-white border border-[#2a2a2a]'
                        }`} />
                        <span className="text-sm font-medium text-white">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#888] mb-3">Accent Color</label>
                  <div className="flex gap-3">
                    {['gold', 'blue', 'purple', 'emerald', 'rose'].map(color => (
                      <button
                        key={color}
                        className={`w-10 h-10 rounded-full ${
                          color === 'gold' ? 'ring-2 ring-offset-2 ring-offset-[#111111] ring-[#d4ae2a]' : ''
                        }`}
                        style={{ backgroundColor: color === 'gold' ? '#d4ae2a' : color === 'blue' ? '#3b82f6' : color === 'purple' ? '#a855f7' : color === 'emerald' ? '#10b981' : '#f43f5e' }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#555]">
                  Theme customization will be available in a future update.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
