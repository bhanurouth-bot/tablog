import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { token } = useContext(AuthContext);
    const [data, setData] = useState({ stock: [], active_loans: [], recent_activity: [], audit_trails: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // State for log filtering
    const navigate = useNavigate();

    // Dynamic resolution for LAN-only setup
    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    const fetchDashboardData = () => {
        axios.get(`${API_BASE_URL}/api/admin/dashboard/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setData(res.data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Dashboard Load Error:", err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchDashboardData();
    }, [token, API_BASE_URL]);

    // Secure CSV Export using Blob to handle Authorization headers
    const handleDownloadCSV = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/export-csv/`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `warehouse_logs_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download logs. Ensure you are an admin.");
        }
    };

    if (loading) return <div className="app-container">Loading Dashboard...</div>;

    return (
        <div className="app-container" style={{ maxWidth: '900px', display: 'block', margin: '0 auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '24px 24px 0 0' }}>
                <h2 style={{ margin: 0 }}>Management Overview</h2>
                <button 
                    onClick={() => navigate('/checkin')} 
                    style={{ background: 'white', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Back to App
                </button>
            </div>

            {/* Global Stock Status with Low Stock Alerts */}
            <div className="card" style={{ maxWidth: '100%', marginBottom: '30px', padding: '20px', borderRadius: '0 0 24px 24px' }}>
                <h3>Global Stock Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    {data.stock.map(tab => {
                        const isLow = tab.stock_remaining < 10; // Simple threshold check
                        return (
                            <div key={tab.id} style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: isLow ? '#fff1f2' : '#fefefe' }}>
                                <div style={{ fontWeight: 'bold' }}>{tab.name}</div>
                                <div style={{ fontSize: '24px', margin: '10px 0', color: isLow ? '#ef4444' : '#111827' }}>{tab.stock_remaining}</div>
                                <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${Math.min((tab.stock_remaining / 100) * 100, 100)}%`, 
                                        background: isLow ? '#ef4444' : '#3b82f6', 
                                        borderRadius: '4px' 
                                    }}></div>
                                </div>
                                <small style={{ color: '#6b7280' }}>Daily Limit: {tab.daily_limit_per_user}</small>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Staff Currently Holding Tabs */}
            <div className="card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '30px' }}>
                <h3>Staff Currently Holding Tabs</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '10px' }}>Employee</th>
                            <th style={{ padding: '10px' }}>Tab Type</th>
                            <th style={{ padding: '10px' }}>Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.active_loans.map((loan, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>{loan.user__username} ({loan.user__employee_id})</td>
                                <td style={{ padding: '12px' }}>{loan.tab__name}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                        {loan.balance}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recent Activity with Search Filter */}
            <div className="card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Recent Activity</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            className="input-field"
                            style={{ margin: 0, padding: '8px 12px', width: '200px', fontSize: '13px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={handleDownloadCSV} 
                            className="btn-primary" 
                            style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', marginTop: 0 }}
                        >
                            📥 Export CSV
                        </button>
                    </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {data.recent_activity
                        .filter(log => 
                            log.user__username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.tab__name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((log, idx) => (
                            <li key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
                                <strong>{log.user__username}</strong> {log.quantity > 0 ? 'logged' : 'returned'} 
                                <strong> {log.tab__name}</strong> 
                                <span style={{ color: '#6b7280', float: 'right' }}>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                            </li>
                        ))}
                </ul>
            </div>

            {/* Admin Audit Trails */}
            <div className="card" style={{ maxWidth: '100%', padding: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Inventory Audit Trails</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {data.audit_trails.map((trail, idx) => (
                        <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{trail.action_type}</span>
                                <span style={{ color: '#999' }}>{new Date(trail.timestamp).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', color: '#4b5563' }}>
                                <strong>{trail.admin__username}:</strong> {trail.description}
                            </p>
                        </div>
                    ))}
                    {data.audit_trails.length === 0 && (
                        <p style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>No admin actions recorded.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;