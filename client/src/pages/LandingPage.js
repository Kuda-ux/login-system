import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Users, UserCheck, QrCode, Clock, Smartphone, ArrowRight, Zap, Globe, Lock, ChevronRight, Target, Radio } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-15 blur-[150px] transition-all duration-[2000ms] ease-out"
          style={{
            background: 'radial-gradient(circle, #d4ae2a 0%, transparent 70%)',
            left: mousePosition.x - 400,
            top: mousePosition.y - 400,
          }}
        />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#d4ae2a]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#d4ae2a]/3 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,174,42,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(212,174,42,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-lg shadow-[#d4ae2a]/20">
              <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block leading-tight">Cherubim Security</span>
              <span className="text-[10px] text-[#d4ae2a] uppercase tracking-[0.2em] font-medium">Priority In Protecting Value</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#888] hover:text-[#d4ae2a] transition text-sm font-medium">Features</a>
            <a href="#portals" className="text-[#888] hover:text-[#d4ae2a] transition text-sm font-medium">Portals</a>
            <a href="#about" className="text-[#888] hover:text-[#d4ae2a] transition text-sm font-medium">About</a>
          </div>
          <Link 
            to="/admin/login"
            className="px-6 py-2.5 bg-[#d4ae2a] text-black hover:bg-[#e8c847] rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#d4ae2a]/20"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 px-6 pt-16 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[rgba(212,174,42,0.08)] border border-[rgba(212,174,42,0.15)] rounded-full mb-10">
            <div className="w-2 h-2 bg-[#d4ae2a] rounded-full pulse-dot" />
            <span className="text-sm text-[#d4ae2a] font-medium">Professional Security Operations Platform</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-8 leading-[0.95]">
            <span className="block text-white">Trusted Security.</span>
            <span className="block bg-gradient-to-r from-[#d4ae2a] via-[#e8c847] to-[#d4ae2a] bg-clip-text text-transparent">
              Total Control.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[#888] max-w-2xl mx-auto mb-12 leading-relaxed">
            Enterprise security operations for visitor management, guard control, 
            incident reporting, and real-time patrol verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/admin/login"
              className="group px-10 py-4 bg-[#d4ae2a] text-black rounded-full font-bold text-lg hover:bg-[#e8c847] transition-all flex items-center gap-3 hover:shadow-xl hover:shadow-[#d4ae2a]/25 hover:-translate-y-0.5"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#portals"
              className="px-10 py-4 bg-[rgba(212,174,42,0.08)] hover:bg-[rgba(212,174,42,0.15)] border border-[rgba(212,174,42,0.2)] rounded-full font-semibold text-lg transition flex items-center gap-2 text-white"
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
            <p className="text-[#888] max-w-xl mx-auto">Choose your role to access the appropriate interface</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Visitor Portal */}
            <div className="group relative bg-gradient-to-b from-[rgba(212,174,42,0.08)] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(212,174,42,0.15)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0a] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-[#d4ae2a] to-[#b8941f] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-[#d4ae2a]/20">
                  <QrCode className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-3">Visitor Check-In</h3>
                <p className="text-[#666] text-sm mb-6 leading-relaxed">
                  Scan QR at entrance. No app needed. Instant digital registration.
                </p>
                <div className="flex items-center gap-2 text-[#d4ae2a] text-sm font-medium">
                  <Smartphone className="w-4 h-4" />
                  <span>Scan to access</span>
                </div>
              </div>
            </div>

            {/* Security Portal */}
            <Link to="/security/login" className="group relative bg-gradient-to-b from-[rgba(255,255,255,0.05)] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(212,174,42,0.12)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0a] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/20">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Supervisor Portal</h3>
                <p className="text-[#666] text-sm mb-6 leading-relaxed">
                  Real-time monitoring. Visitor tracking. Guard attendance control.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all">
                  <span>Access Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Staff Portal */}
            <Link to="/staff/login" className="group relative bg-gradient-to-b from-[rgba(255,255,255,0.05)] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(212,174,42,0.12)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0a] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/20">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Guard Portal</h3>
                <p className="text-[#666] text-sm mb-6 leading-relaxed">
                  Clock in/out. Track hours. Patrol verification. Attendance.
                </p>
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
                  <span>Access Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Admin Portal */}
            <Link to="/admin/login" className="group relative bg-gradient-to-b from-[rgba(212,174,42,0.1)] to-transparent p-[1px] rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(212,174,42,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0a] rounded-3xl p-8 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-[#d4ae2a] to-[#b8941f] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-[#d4ae2a]/20">
                  <Building2 className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-3">Admin HQ</h3>
                <p className="text-[#666] text-sm mb-6 leading-relaxed">
                  Full control. Client sites. Personnel. Reports. Weapons.
                </p>
                <div className="flex items-center gap-2 text-[#d4ae2a] text-sm font-medium group-hover:gap-3 transition-all">
                  <span>Access Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 border-t border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[rgba(212,174,42,0.08)] border border-[rgba(212,174,42,0.15)] rounded-full mb-6">
              <Zap className="w-4 h-4 text-[#d4ae2a]" />
              <span className="text-sm text-[#d4ae2a] font-medium">Powerful Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Everything You Need</h2>
            <p className="text-[#888] max-w-2xl mx-auto text-lg">
              Enterprise-grade tools for modern security operations management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: UserCheck, title: 'Visitor Management', desc: 'QR-based check-in/out with automatic logging, device fingerprinting, and IP tracking for maximum accountability.', color: 'from-[#d4ae2a]/20 to-[#b8941f]/10', iconColor: 'text-[#d4ae2a]' },
              { icon: Users, title: 'Guard Control', desc: 'Real-time guard attendance, patrol verification, QR-based clock in/out, and comprehensive shift tracking.', color: 'from-emerald-500/10 to-emerald-700/5', iconColor: 'text-emerald-400' },
              { icon: Target, title: 'Asset Patrol Tags', desc: 'QR-coded patrol checkpoints for asset verification. Guards scan checkpoints to prove patrol completion.', color: 'from-blue-500/10 to-indigo-500/5', iconColor: 'text-blue-400' },
              { icon: Radio, title: 'Incident Reporting', desc: 'Real-time incident submission with severity tracking, category classification, and resolution workflow.', color: 'from-red-500/10 to-orange-500/5', iconColor: 'text-red-400' },
              { icon: Lock, title: 'Weapons Armory', desc: 'Complete weapon issuance and return tracking with guard clearance verification and condition reporting.', color: 'from-amber-500/10 to-yellow-500/5', iconColor: 'text-amber-400' },
              { icon: Globe, title: 'Offline-First', desc: 'Works without internet. Data syncs automatically when connection is restored. Built for real field conditions.', color: 'from-cyan-500/10 to-blue-500/5', iconColor: 'text-cyan-400' },
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-[#111111] border border-[#1f1f1f] hover:border-[rgba(212,174,42,0.2)] transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-[#666] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="relative z-10 py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#d4ae2a]/20 via-[#b8941f]/10 to-transparent p-[1px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4ae2a]/10 via-[#b8941f]/5 to-transparent opacity-50 blur-xl" />
            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl rounded-[2.5rem] p-12 sm:p-16 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl p-2 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#d4ae2a]/20">
                <img src="/cherubim-security-logo.svg" alt="Cherubim Security" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Ready to Secure Your Operations?
              </h2>
              <p className="text-[#888] text-lg max-w-2xl mx-auto mb-10">
                Join Cherubim Security's digital operations platform. 
                Real-time monitoring, comprehensive reporting, and total control.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/admin/login"
                  className="group px-10 py-4 bg-[#d4ae2a] text-black rounded-full font-bold text-lg hover:bg-[#e8c847] transition-all flex items-center gap-2 hover:shadow-xl hover:shadow-[#d4ae2a]/25"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1f1f1f] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center">
                <img src="/cherubim-security-logo.svg" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-lg font-bold block leading-tight">Cherubim Security</span>
                <span className="text-[10px] text-[#d4ae2a] uppercase tracking-[0.15em]">(Pvt) Ltd</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#555]">
              <span>&copy; 2026 Cherubim Security (Pvt) Ltd</span>
              <span className="hidden sm:inline text-[#333]">|</span>
              <span className="hidden sm:inline">Priority In Protecting Value</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
