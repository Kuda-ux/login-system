import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Users, UserCheck, QrCode, Clock, CreditCard, Smartphone } from 'lucide-react';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Building Management
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                & Visitor Tracking
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Complete offline-first platform for building security, visitor logging, 
              staff attendance, and rent collection.
            </p>
          </div>
        </div>
      </header>

      {/* Portal Cards */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Select Your Portal</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Visitor Portal */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:border-blue-500/50 transition group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Visitor Check-In</h3>
            <p className="text-gray-400 text-sm mb-6">
              Scan the QR code at the building entrance to register your visit. No app download required.
            </p>
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Scan QR at entrance</span>
            </div>
          </div>

          {/* Security Portal */}
          <Link 
            to="/security/login"
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:border-emerald-500/50 transition group cursor-pointer"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Security Portal</h3>
            <p className="text-gray-400 text-sm mb-6">
              Monitor visitors, scan badges, and manage building access in real-time.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              Access Portal →
            </div>
          </Link>

          {/* Staff Portal */}
          <Link 
            to="/staff/login"
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:border-purple-500/50 transition group cursor-pointer"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Staff Portal</h3>
            <p className="text-gray-400 text-sm mb-6">
              Clock in/out, view attendance history, and manage your work schedule.
            </p>
            <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
              Access Portal →
            </div>
          </Link>

          {/* Admin Portal */}
          <Link 
            to="/admin/login"
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:border-amber-500/50 transition group cursor-pointer"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Admin Dashboard</h3>
            <p className="text-gray-400 text-sm mb-6">
              Full management access: buildings, tenants, payments, reports, and settings.
            </p>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
              Access Dashboard →
            </div>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Platform Features</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to manage building access, security, and tenant services in one platform.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Visitor Management</h3>
              <p className="text-gray-400 text-sm">
                QR-based check-in/out, automatic logging, device fingerprinting, and IP tracking for security.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Staff Attendance</h3>
              <p className="text-gray-400 text-sm">
                Digital clock-in/out, work hours tracking, attendance history, and automated reports.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Rent Collection</h3>
              <p className="text-gray-400 text-sm">
                QR payment codes, multiple payment methods (EcoCash, InBucks, Mastercard), and payment tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Offline First Banner */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Works Offline, Syncs Online
            </h2>
            <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
              Built with offline-first architecture. Continue working even without internet - 
              all data syncs automatically when connection is restored.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/20 px-4 py-2 rounded-full text-white">Progressive Web App</span>
              <span className="bg-white/20 px-4 py-2 rounded-full text-white">Local Storage</span>
              <span className="bg-white/20 px-4 py-2 rounded-full text-white">Auto Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Building Management System v1.0 • Built for Zimbabwe
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
