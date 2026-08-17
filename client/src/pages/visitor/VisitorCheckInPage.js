import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, User, Phone, CreditCard, FileText, CheckCircle, LogOut, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import api from '../../utils/api';
import { v4 as uuidv4 } from 'uuid';

function VisitorCheckInPage() {
  const { buildingId } = useParams();
  const [building, setBuilding] = useState(null);
  const [step, setStep] = useState('loading');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    id_number: '',
    purpose: ''
  });
  const [existingVisit, setExistingVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    generateFingerprint();
    if (buildingId) {
      fetchBuilding();
      checkVisitorStatus();
    } else {
      setStep('error');
      setError('No building specified. Please scan the QR code at the building entrance.');
    }
  }, [buildingId]);

  const generateFingerprint = () => {
    const fp = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}`;
    setDeviceFingerprint(fp);
  };

  const fetchBuilding = async () => {
    try {
      const res = await api.get(`/buildings/${buildingId}/public`);
      setBuilding(res.data.building);
    } catch (err) {
      setStep('error');
      setError('Building not found. Please ensure you scanned the correct QR code.');
    }
  };

  const checkVisitorStatus = async () => {
    try {
      const res = await api.post('/visitors/status', {
        building_id: buildingId,
        device_fingerprint: deviceFingerprint || `${navigator.userAgent}-${window.screen.width}x${window.screen.height}`
      });
      
      if (res.data.status === 'checked_in') {
        setExistingVisit(res.data.visitor);
        setStep('already_checked_in');
      } else {
        setStep('form');
      }
    } catch (err) {
      setStep('form');
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        building_id: buildingId,
        device_fingerprint: deviceFingerprint
      };

      if (isOnline) {
        const res = await api.post('/visitors/check-in', payload);
        setExistingVisit(res.data.visitor);
        setStep('success');
      } else {
        const offlineVisit = {
          id: uuidv4(),
          ...payload,
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
          synced: false
        };
        const stored = JSON.parse(localStorage.getItem('offline_visits') || '[]');
        stored.push(offlineVisit);
        localStorage.setItem('offline_visits', JSON.stringify(stored));
        setExistingVisit(offlineVisit);
        setStep('success');
      }
    } catch (err) {
      if (err.response?.data?.existing_visit) {
        setExistingVisit(err.response.data.existing_visit);
        setStep('already_checked_in');
      } else {
        setError(err.response?.data?.error || 'Check-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError('');

    try {
      if (isOnline) {
        await api.post('/visitors/check-out', {
          building_id: buildingId,
          device_fingerprint: deviceFingerprint,
          visitor_id: existingVisit?.id
        });
      } else {
        const stored = JSON.parse(localStorage.getItem('offline_visits') || '[]');
        const updated = stored.map(v => 
          v.id === existingVisit?.id ? { ...v, check_out_time: new Date().toISOString(), status: 'checked_out' } : v
        );
        localStorage.setItem('offline_visits', JSON.stringify(updated));
      }
      setStep('checkout');
    } catch (err) {
      setError(err.response?.data?.error || 'Check-out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#d4ae2a] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#888]">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Oops!</h1>
          <p className="text-[#888] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 bg-[#d4ae2a] text-black rounded-xl font-bold hover:bg-[#e8c847] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Data will sync when connected
        </div>
      )}

      {/* Header */}
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl p-1.5 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#d4ae2a]/15">
          <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white">{building?.name || 'Building'}</h1>
        <p className="text-[#888] text-sm mt-1">{building?.address}</p>
        <p className="text-[#d4ae2a] text-xs mt-2 uppercase tracking-[0.15em] font-medium">Cherubim Security</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#111111] border-t border-[#1f1f1f] rounded-t-[2.5rem] p-6 overflow-y-auto">
        {step === 'form' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Visitor Check-In</h2>
            <p className="text-[#666] text-sm mb-6">Please fill in your details to register your visit</p>

            {error && (
              <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#888] mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)] focus:outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#888] mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)] focus:outline-none transition-all"
                    placeholder="+263 7X XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#888] mb-2">ID Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                  <input
                    type="text"
                    required
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)] focus:outline-none transition-all"
                    placeholder="National ID or Passport"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#888] mb-2">Purpose of Visit</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-[#555]" />
                  <textarea
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] focus:border-[#d4ae2a] focus:ring-2 focus:ring-[rgba(212,174,42,0.15)] focus:outline-none transition-all resize-none"
                    rows="3"
                    placeholder="Who are you visiting and why?"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#d4ae2a] text-black rounded-xl font-bold text-base hover:bg-[#e8c847] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#d4ae2a]/15 mt-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Check In
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-[#444] text-center mt-6">
              By checking in, you agree to have your visit logged for security purposes.
            </p>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-[#888] mb-6">You have successfully checked in</p>
            
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-6 text-left mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#666]">Name</span>
                  <span className="font-medium text-white">{existingVisit?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Building</span>
                  <span className="font-medium text-white">{building?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Time</span>
                  <span className="font-medium text-[#d4ae2a]">{new Date(existingVisit?.check_in_time).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#666] mb-4">
              Remember to check out when you leave by scanning the QR code again.
            </p>
          </div>
        )}

        {step === 'already_checked_in' && (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-[rgba(212,174,42,0.1)] rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12 text-[#d4ae2a]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-[#888] mb-6">You are currently checked in</p>
            
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-6 text-left mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#666]">Name</span>
                  <span className="font-medium text-white">{existingVisit?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Checked In</span>
                  <span className="font-medium text-[#d4ae2a]">{new Date(existingVisit?.check_in_time).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  Check Out
                </>
              )}
            </button>
          </div>
        )}

        {step === 'checkout' && (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Goodbye!</h2>
            <p className="text-[#888] mb-6">You have successfully checked out</p>
            <p className="text-sm text-[#555]">Thank you for visiting {building?.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisitorCheckInPage;
