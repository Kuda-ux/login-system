import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Users, UserCheck, QrCode, Clock, CreditCard, Smartphone, ArrowRight, Zap, Globe, Lock, ChevronRight, Sparkles } from 'lucide-react';

function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-[120px] transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            left: mousePosition.x - 400,
            top: mousePosition.y - 400,
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SecureOps</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition text-sm">Features</a>
            <a href="#portals" className="text-gray-400 hover:text-white transition text-sm">Portals</a>
            <a href="#about" className="text-gray-400 hover:text-white transition text-sm">About</a>
          </div>
          <Link 
            to="/admin/login"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm font-medium transition backdrop-blur-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-300">Next-Gen Security Operations Platform</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
            <span className="block">Smart Building</span>
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Access Control
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Security operations for visitor management, guard control, incident reporting, and patrol verification.
            Built for trial-ready field operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/admin/login"
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#portals"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg transition flex items-center gap-2"
            >
              Explore Portals
            </a>
          </div>
        </div>
      </header>

      {/* Portal Cards */}
      <section id="portals" className="relative z-10 px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Access Your Portal</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Choose your role to access the appropriate interface</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Visitor Portal */}
            <div className="group relative bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0f] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-cyan-500/20">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Visitor Check-In</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Scan QR at entrance. No app needed. Instant registration.
                </p>
                <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                  <Smartphone className="w-4 h-4" />
                  <span>Scan to access</span>
                </div>
              </div>
            </div>

            {/* Security Portal */}
            <Link to="/security/login" className="group relative bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0f] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/20">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Security Portal</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Real-time monitoring. Visitor tracking. Access control.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all">
                  <span>Access Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Staff Portal */}
            <Link to="/staff/login" className="group relative bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0f] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-purple-500/20">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Staff Portal</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Clock in/out. Track hours. View attendance history.
                </p>
                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:gap-3 transition-all">
                  <span>Access Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Admin Portal */}
            <Link to="/admin/login" className="group relative bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0f] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-amber-500/20">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Admin Dashboard</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Full control. Buildings. Tenants. Payments. Reports.
                </p>
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:gap-3 transition-all">
                  <span>Access Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Powerful Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Everything You Need</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Enterprise-grade tools for modern building management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-white/10 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <UserCheck className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Visitor Management</h3>
              <p className="text-gray-500 leading-relaxed">
                QR-based check-in/out with automatic logging, device fingerprinting, and IP tracking for maximum security.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-white/10 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Staff Attendance</h3>
              <p className="text-gray-500 leading-relaxed">
                Digital clock-in/out system with work hours tracking, attendance history, and automated reporting.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-white/10 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <CreditCard className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rent Collection</h3>
              <p className="text-gray-500 leading-relaxed">
                QR payment codes with EcoCash, InBucks, and Mastercard support. Full payment tracking and history.
              </p>
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-white/10 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Globe className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Offline-First</h3>
              <p className="text-gray-500 leading-relaxed">
                Works without internet. Data syncs automatically when connection is restored. Perfect for Zimbabwe.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-white/10 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Lock className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
              <p className="text-gray-500 leading-relaxed">
                End-to-end encryption, IP logging, device fingerprinting, and role-based access control.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-white/10 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Zap className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Tenant</h3>
              <p className="text-gray-500 leading-relaxed">
                Manage multiple buildings from one platform. Scale effortlessly as your portfolio grows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="relative z-10 py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-[1px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-50 blur-xl" />
            <div className="relative bg-[#0a0a0f]/80 backdrop-blur-xl rounded-[2.5rem] p-12 sm:p-16 text-center">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to Transform Your Building?
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
                Join the future of building management. Works offline, syncs online, 
                and scales with your needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/admin/login"
                  className="group px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-[#0a0a0f]" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-[#0a0a0f]" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-[#0a0a0f]" />
                  </div>
                  <span className="text-sm">Trusted by building managers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">BuildingMS</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <span>© 2024 BuildingMS</span>
              <span>•</span>
              <span>Built for Zimbabwe</span>
              <span>•</span>
              <span>v1.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
