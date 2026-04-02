import { useState, useEffect } from 'react'
import { getDashboard } from '../services/api'

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const res = await getDashboard()
            setData(res.data)
        } catch (err) {
            console.error('Dashboard error:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div style={{ color: 'var(--text-secondary)', padding: 40 }}>Loading dashboard...</div>

    const stats = data?.stats || {}

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <button className="btn btn-outline" onClick={loadDashboard}>🔄 Refresh</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(233,69,96,0.15)' }}>👥</div>
                    <div className="stat-value">{stats.totalGroups || 0}</div>
                    <div className="stat-label">Total Groups</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(0,184,148,0.15)' }}>✅</div>
                    <div className="stat-value">{stats.activeGroups || 0}</div>
                    <div className="stat-label">Active Groups</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(108,92,231,0.15)' }}>🧑</div>
                    <div className="stat-value">{stats.totalUsers || 0}</div>
                    <div className="stat-label">Total Members</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(240,165,0,0.15)' }}>💰</div>
                    <div className="stat-value">₹{(stats.verifiedAmount || 0).toLocaleString()}</div>
                    <div className="stat-label">Collected</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Pending Payments */}
                <div className="stat-card">
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⏳ Pending Payments</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Count</span>
                        <span style={{ fontWeight: 700 }}>{stats.pendingCount || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                        <span style={{ fontWeight: 700, color: 'var(--warning)' }}>₹{(stats.pendingAmount || 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Verified Payments */}
                <div className="stat-card">
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✅ Verified Payments</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Count</span>
                        <span style={{ fontWeight: 700 }}>{stats.verifiedCount || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{(stats.verifiedAmount || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Recent Payments */}
            {data?.recentPayments?.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Payments</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Group</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentPayments.map(p => (
                                <tr key={p._id}>
                                    <td>{p.user?.name || p.user?.phone || '—'}</td>
                                    <td>{p.group?.name || '—'}</td>
                                    <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Group Progress */}
            {data?.groupStats?.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Group Progress</h3>
                    {data.groupStats.map(g => (
                        <div key={g._id} style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 12, padding: 14, marginBottom: 8,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600 }}>{g.name}</span>
                                <span className={`badge badge-${g.status}`}>{g.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                <span>{g.memberCount} members</span>
                                <span>Month {g.currentMonth}/{g.totalMonths}</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${g.progress?.toFixed(0) || 0}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
