import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function SecurityLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        if (['security', 'supervisor', 'admin'].includes(result.user.role)) {
          navigate('/security');
        } else {
          setError('Access denied. Supervisor / Manager portal only.');
        }
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#d4ae2a]/3 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,174,42,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(212,174,42,0.012)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white rounded-3xl p-2 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[#d4ae2a]/15 gold-glow">
            <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">Cherubim Security</h1>
          <p className="text-[#d4ae2a] text-sm font-medium uppercase tracking-[0.15em]">Supervisor & Guard Control</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-semibold text-white mb-1">Supervisor Sign In</h2>
          <p className="text-[#555] text-sm mb-7">Access the security control portal</p>

          {error && (
            <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#888] mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)] focus:outline-none transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#888] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)] focus:outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#d4ae2a] transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#d4ae2a] text-black rounded-xl font-bold text-base hover:bg-[#e8c847] transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#d4ae2a]/20 mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black"></div>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Access Control Portal
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 px-2">
          <p className="text-[#555] text-[11px] leading-relaxed">
            <span className="text-[#888] font-medium">Privacy Notice:</span> By signing in you consent to Cherubim Security
            collecting, processing, and storing your login credentials, IP address, device information, and activity
            logs for security, audit, and operational purposes. Access is monitored and recorded. Unauthorized use is
            prohibited and may be subject to legal action. See our Privacy Policy for full details.
          </p>
        </div>

        <p className="text-center text-[#444] text-xs mt-8 tracking-wide">
          AUTHORIZED PERSONNEL ONLY &middot; ALL ACCESS IS LOGGED
        </p>
      </div>
    </div>
  );
}

export default SecurityLogin;
