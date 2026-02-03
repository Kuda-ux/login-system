import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Users, Building2, CreditCard, UserCheck, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState({ recent_visitors: [], recent_payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity')
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  const statCards = [
    { label: 'Buildings', value: stats?.total_buildings || 0, icon: Building2, color: '#3b82f6' },
    { label: 'Today\'s Visitors', value: stats?.today_visitors || 0, icon: UserCheck, color: '#10b981' },
    { label: 'Active Visitors', value: stats?.active_visitors || 0, icon: Users, color: '#f59e0b' },
    { label: 'Total Tenants', value: stats?.total_tenants || 0, icon: Users, color: '#8b5cf6' },
    { label: 'Monthly Revenue', value: `$${(stats?.monthly_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { label: 'Pending Payments', value: stats?.pending_payments_count || 0, icon: CreditCard, color: '#ef4444' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Welcome back, {user?.full_name}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Here's what's happening today</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {statCards.map((stat, i) => (
          <div key={i} className="card stat-card">
            <stat.icon size={32} color={stat.color} style={{ marginBottom: '0.5rem' }} />
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Visitors</h3>
          </div>
          {activity.recent_visitors.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No recent visitors</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Name</th><th>Building</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {activity.recent_visitors.slice(0, 5).map((v) => (
                    <tr key={v.id}>
                      <td>{v.full_name}</td>
                      <td>{v.building_name}</td>
                      <td>{new Date(v.check_in_time).toLocaleTimeString()}</td>
                      <td><span className={`badge ${v.status === 'checked_in' ? 'badge-success' : 'badge-primary'}`}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Payments</h3>
          </div>
          {activity.recent_payments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No recent payments</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Tenant</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {activity.recent_payments.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>{p.tenant_name}</td>
                      <td>${p.amount}</td>
                      <td><span className={`badge ${p.payment_status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{p.payment_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
