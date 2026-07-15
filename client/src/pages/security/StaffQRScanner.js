import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, XCircle, User, Clock, 
  LogIn, LogOut, Shield, Zap, Phone, RefreshCw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function StaffQRScanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const html5QrCodeRef = useRef(null);
  const isMountedRef = useRef(true);
  const scanLockRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupScanner();
    };
  }, []);

  const cleanupScanner = useCallback(async () => {
    try {
      if (html5QrCodeRef.current) {
        const scanner = html5QrCodeRef.current;
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.warn('Scanner cleanup:', err.message);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError('');
    setResult(null);

    // Cleanup any existing scanner first
    await cleanupScanner();

    // Set scanning state and wait for DOM to render the container
    setScanning(true);

    // Use requestAnimationFrame + small delay to ensure DOM is painted
    requestAnimationFrame(() => {
      setTimeout(async () => {
        if (!isMountedRef.current) return;

        const readerEl = document.getElementById('qr-reader-container');
        if (!readerEl) {
          console.error('QR reader container not found in DOM');
          if (isMountedRef.current) {
            setError('Scanner failed to initialize. Please refresh and try again.');
            setScanning(false);
          }
          return;
        }

        try {
          const html5QrCode = new Html5Qrcode('qr-reader-container');
          html5QrCodeRef.current = html5QrCode;

          // Get available cameras to pick the best one
          let cameraConfig = { facingMode: 'environment' };
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              // Prefer rear camera (usually last in list or has 'back'/'rear'/'environment' in label)
              const rearCamera = cameras.find(c => 
                /back|rear|environment/i.test(c.label)
              );
              if (rearCamera) {
                cameraConfig = { deviceId: { exact: rearCamera.id } };
              } else if (cameras.length > 1) {
                // On most phones, the last camera is the rear one
                cameraConfig = { deviceId: { exact: cameras[cameras.length - 1].id } };
              }
            }
          } catch (camErr) {
            console.warn('Camera enumeration failed, using facingMode fallback:', camErr.message);
          }

          await html5QrCode.start(
            cameraConfig,
            {
              fps: 10,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
                return { width: Math.floor(size), height: Math.floor(size) };
              },
              aspectRatio: 1.0,
              disableFlip: false
            },
            (decodedText) => {
              if (!scanLockRef.current) {
                scanLockRef.current = true;
                handleScanResult(decodedText);
              }
            },
            () => {
              // Ignore continuous scan miss errors
            }
          );
        } catch (err) {
          console.error('Scanner start error:', err);
          if (!isMountedRef.current) return;
          setScanning(false);
          
          const errStr = String(err);
          if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
            setError('Camera access denied. Please allow camera permission in your browser settings and try again.');
          } else if (errStr.includes('NotFoundError') || errStr.includes('Requested device not found')) {
            setError('No camera found on this device. Please make sure your device has a camera.');
          } else if (errStr.includes('NotReadableError') || errStr.includes('Could not start video source')) {
            setError('Camera is in use by another app. Please close other apps using the camera and try again.');
          } else if (errStr.includes('OverconstrainedError')) {
            // Retry with basic facingMode if deviceId failed
            try {
              const html5QrCode = new Html5Qrcode('qr-reader-container');
              html5QrCodeRef.current = html5QrCode;
              await html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                  if (!scanLockRef.current) {
                    scanLockRef.current = true;
                    handleScanResult(decodedText);
                  }
                },
                () => {}
              );
              if (isMountedRef.current) setScanning(true);
              return;
            } catch (retryErr) {
              setError('Failed to access camera. Please try again.');
            }
          } else {
            setError('Failed to start camera. Make sure you are using HTTPS and camera permissions are granted.');
          }
        }
      }, 300); // 300ms delay for DOM to settle
    });
  }, [cleanupScanner]);

  const stopScanner = useCallback(async () => {
    await cleanupScanner();
    if (isMountedRef.current) {
      setScanning(false);
      scanLockRef.current = false;
    }
  }, [cleanupScanner]);

  const handleScanResult = async (qrData) => {
    if (processing) return;
    setProcessing(true);
    setError('');

    // Stop scanner immediately after successful scan
    await cleanupScanner();
    if (isMountedRef.current) setScanning(false);

    try {
      const res = await api.post('/staff/scan', { qr_data: qrData });
      if (!isMountedRef.current) return;
      setResult(res.data);
      
      setRecentScans(prev => [{
        ...res.data,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 10));

    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMsg = err.response?.data?.error || 'Scan failed. Please try again.';
      setError(errorMsg);
    } finally {
      if (isMountedRef.current) {
        setProcessing(false);
        scanLockRef.current = false;
      }
    }
  };

  const scanAgain = () => {
    setResult(null);
    setError('');
    scanLockRef.current = false;
    startScanner();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => { stopScanner(); navigate('/security'); }}
            className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-white">Guard QR Scanner</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Scanner Camera View — always one single element, visibility controlled */}
        {scanning && (
          <div className="mb-6">
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
              <div className="p-4 flex items-center gap-2 border-b border-slate-800">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-slate-400 text-sm">Camera Active — Point at staff QR code</span>
              </div>
              <div
                id="qr-reader-container"
                className="w-full"
                style={{ minHeight: '320px', background: '#000' }}
              ></div>
            </div>
            <button
              onClick={stopScanner}
              className="w-full mt-4 py-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Start Scanner Prompt */}
        {!scanning && !result && !error && !processing && (
          <div className="mb-6 text-center">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl p-10 mb-6 border border-cyan-500/30">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Scan Guard QR Code</h2>
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
                Try Again
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
