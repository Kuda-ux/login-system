import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, CheckCircle, XCircle, User, Clock, 
  LogIn, LogOut, AlertCircle, Shield, Zap, Phone, RefreshCw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function StaffQRScanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { action, message, staff, entry }
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError('');
    setResult(null);
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScanResult(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore scan errors — they happen continuously while looking for QR
        }
      );
    } catch (err) {
      console.error('Scanner start error:', err);
      setScanning(false);
      if (err.toString().includes('NotAllowedError')) {
        setError('Camera access denied. Please allow camera permission and try again.');
      } else if (err.toString().includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else {
        setError('Failed to start camera. Please make sure you are using HTTPS and camera is available.');
      }
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (err) {
      // Ignore stop errors
    }
    setScanning(false);
  };

  const handleScanResult = async (qrData) => {
    if (processing) return;
    setProcessing(true);
    setError('');

    try {
      const res = await api.post('/staff/scan', { qr_data: qrData });
      setResult(res.data);
      
      // Add to recent scans
      setRecentScans(prev => [{
        ...res.data,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 10));

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Scan failed. Please try again.';
      setError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const scanAgain = () => {
    setResult(null);
    setError('');
    startScanner();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/security')}
            className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-white">Staff QR Scanner</span>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Scanner Area */}
        {!result && !error && (
          <div className="mb-6">
            {scanning ? (
              <div className="relative">
                <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
                  <div className="p-4 flex items-center gap-2 border-b border-slate-800">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-400 text-sm">Camera Active — Point at staff QR code</span>
                  </div>
                  <div id="qr-reader" className="w-full" style={{ minHeight: '300px' }}></div>
                </div>
                <button
                  onClick={stopScanner}
                  className="w-full mt-4 py-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl p-10 mb-6 border border-cyan-500/30">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                    <Camera className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Scan Staff QR Code</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Point the camera at a staff member's QR code to check them in or out of the building
                  </p>
                  <button
                    onClick={startScanner}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Camera className="w-5 h-5" />
                    Open Camera
                  </button>
                </div>
              </div>
            )}

            {/* Hidden scanner container for when camera is off */}
            {!scanning && <div id="qr-reader" style={{ display: 'none' }}></div>}
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-400">Processing scan...</p>
          </div>
        )}

        {/* Error State */}
        {error && !processing && (
          <div className="mb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Scan Failed</h3>
              <p className="text-slate-400 text-sm mb-6">{error}</p>
              <button
                onClick={scanAgain}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && !processing && (
          <div className="mb-6">
            <div className={`rounded-3xl p-8 text-center border ${
              result.action === 'entry' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                result.action === 'entry' 
                  ? 'bg-emerald-500/20' 
                  : 'bg-amber-500/20'
              }`}>
                {result.action === 'entry' ? (
                  <LogIn className="w-10 h-10 text-emerald-400" />
                ) : (
                  <LogOut className="w-10 h-10 text-amber-400" />
                )}
              </div>

              <h3 className={`text-lg font-bold mb-2 ${
                result.action === 'entry' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {result.action === 'entry' ? 'Checked In' : 'Checked Out'}
              </h3>
              <p className="text-slate-400 text-sm mb-6">{result.message}</p>

              {/* Staff Details */}
              <div className="bg-slate-900/50 rounded-2xl p-4 text-left space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-slate-500 text-xs">Name</p>
                    <p className="text-white font-medium">{result.staff?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-slate-500 text-xs">Role</p>
                    <p className="text-white font-medium capitalize">{result.staff?.role}</p>
                  </div>
                </div>
                {result.staff?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-slate-500 text-xs">Phone</p>
                      <p className="text-white font-medium">{result.staff?.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-slate-500 text-xs">
                      {result.action === 'entry' ? 'Entry Time' : 'Exit Time'}
                    </p>
                    <p className="text-white font-medium">
                      {new Date(result.action === 'entry' ? result.entry?.entry_time : result.entry?.exit_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {result.entry?.hours_worked && (
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-slate-500 text-xs">Hours Worked</p>
                      <p className="text-white font-medium">{result.entry.hours_worked} hrs</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={scanAgain}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan Next
              </button>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Scans</h3>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {recentScans.map((scan, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        scan.action === 'entry' 
                          ? 'bg-emerald-500/20' 
                          : 'bg-amber-500/20'
                      }`}>
                        {scan.action === 'entry' ? (
                          <LogIn className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <LogOut className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{scan.staff?.full_name}</p>
                        <p className="text-slate-500 text-xs">
                          {new Date(scan.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      scan.action === 'entry' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {scan.action === 'entry' ? 'IN' : 'OUT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StaffQRScanner;
