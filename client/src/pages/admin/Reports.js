import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Download, Calendar, Building2,
  Users, UserCheck, DollarSign, Clock, FileText, PieChart, Activity
} from 'lucide-react';
import api from '../../utils/api';

function Reports() {
  const [stats, setStats] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [visitorData, setVisitorData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedBuilding, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = selectedBuilding ? `?building_id=${selectedBuilding}` : '';
      const [statsRes, buildingsRes, visitorsRes, revenueRes] = await Promise.all([
        api.get(`/dashboard/stats${params}`),
        api.get('/buildings'),
        api.get(`/dashboard/charts/visitors?days=${dateRange}${selectedBuilding ? `&building_id=${selectedBuilding}` : ''}`),
        api.get(`/dashboard/charts/revenue?months=6${selectedBuilding ? `&building_id=${selectedBuilding}` : ''}`)
      ]);
      setStats(statsRes.data);
      setBuildings(buildingsRes.data.buildings || []);
      setVisitorData(visitorsRes.data.data || []);
      setRevenueData(revenueRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      building: selectedBuilding ? buildings.find(b => b.id === selectedBuilding)?.name : 'All Buildings',
      stats,
      visitorTrend: visitorData,
      revenueTrend: revenueData
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const StatCard = ({ icon: Icon, label, value, change, color, prefix = '' }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-4">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );

  const maxVisitors = Math.max(...visitorData.map(d => d.count), 1);
  const maxRevenue = Math.max(...revenueData.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive insights into your building operations</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="">All Buildings</option>
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
              <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Building2} 
            label="Total Buildings" 
            value={stats?.total_buildings || 0}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard 
            icon={UserCheck} 
            label="Active Visitors" 
            value={stats?.active_visitors || 0}
            color="bg-green-100 text-green-600"
          />
          <StatCard 
            icon={Users} 
            label="Total Tenants" 
            value={stats?.total_tenants || 0}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard 
            icon={DollarSign} 
            label="Monthly Revenue" 
            value={stats?.monthly_revenue || 0}
            prefix="$"
            color="bg-amber-100 text-amber-600"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Visitor Trend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Visitor Trend</h3>
              <p className="text-sm text-gray-500">Daily visitor check-ins</p>
            </div>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {visitorData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No visitor data available</p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-end gap-1">
              {visitorData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-600 hover:to-indigo-500"
                    style={{ height: `${(d.count / maxVisitors) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
                    title={`${d.date}: ${d.count} visitors`}
                  />
                  <span className="text-xs text-gray-400 truncate w-full text-center">
                    {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-500">Monthly payment collections</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No revenue data available</p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-end gap-2">
              {revenueData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-emerald-500"
                    style={{ height: `${(d.total / maxRevenue) * 100}%`, minHeight: d.total > 0 ? '8px' : '2px' }}
                    title={`${d.month}: $${d.total.toLocaleString()}`}
                  />
                  <span className="text-xs text-gray-400">{d.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="font-medium">Today's Visitors</span>
          </div>
          <p className="text-4xl font-bold">{stats?.today_visitors || 0}</p>
          <p className="text-indigo-200 text-sm mt-2">Check-ins recorded today</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-medium">Pending Payments</span>
          </div>
          <p className="text-4xl font-bold">{stats?.pending_payments_count || 0}</p>
          <p className="text-amber-200 text-sm mt-2">${(stats?.pending_payments_total || 0).toLocaleString()} outstanding</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-medium">Total Owners</span>
          </div>
          <p className="text-4xl font-bold">{stats?.total_owners || 0}</p>
          <p className="text-emerald-200 text-sm mt-2">Registered building owners</p>
        </div>
      </div>
    </div>
  );
}

export default Reports;
