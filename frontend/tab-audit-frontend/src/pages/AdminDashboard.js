import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { token, logout } = useContext(AuthContext);
    
    const [data, setData] = useState({ 
        stats: {}, 
        active_loans: [], 
        recent_activity: [], 
        audit_trails: [], 
        pending_returns: [] 
    });
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Re-added search state
    const navigate = useNavigate();

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

    // Auto-refresh the dashboard every 10 seconds to catch new OTPs
    useEffect(() => {
        fetchDashboardData();
        const intervalId = setInterval(fetchDashboardData, 10000); 
        return () => clearInterval(intervalId);
    }, [token, API_BASE_URL]);

    // RE-ADDED EXPORT CSV FUNCTION
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
                <h2 style={{ margin: 0 }}>Management Dashboard</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* NEW: Button to go to the dedicated Logs Page */}
                    <button onClick={() => navigate('/admin/logs')} style={{ background: 'white', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
                        📋 Full Logs
                    </button>
                    
                    <button onClick={handleDownloadCSV} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
                        📥 Export CSV
                    </button>
                    
                    <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Device Stats */}
            <div className="card" style={{ maxWidth: '100%', marginBottom: '30px', padding: '20px', borderRadius: '0 0 24px 24px' }}>
                <h3>Global Device Status</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, padding: '15px', background: '#fefefe', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center' }}>
                        <div style={{ color: '#6b7280' }}>Total Devices</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.stats.total || 0}</div>
                    </div>
                    <div style={{ flex: 1, padding: '15px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                        <div style={{ color: '#065f46' }}>Available</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{data.stats.available || 0}</div>
                    </div>
                    <div style={{ flex: 1, padding: '15px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                        <div style={{ color: '#1e3a8a' }}>Assigned</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{data.stats.assigned || 0}</div>
                    </div>
                    <div style={{ flex: 1, padding: '15px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', textAlign: 'center' }}>
                        <div style={{ color: '#991b1b' }}>In Repair</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{data.stats.repair || 0}</div>
                    </div>
                </div>
            </div>

            {/* PENDING RETURNS (OTP DISPLAY) */}
            <div className="card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '30px', border: '2px solid #fcd34d' }}>
                <h3 style={{ color: '#b45309', marginTop: 0 }}>⚠️ Pending Returns (Provide these OTPs to users)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '10px' }}>Employee</th>
                            <th style={{ padding: '10px' }}>Device Serial</th>
                            <th style={{ padding: '10px' }}>OTP Code</th>
                            <th style={{ padding: '10px' }}>Requested At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.pending_returns && data.pending_returns.map((pending, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>{pending.device__assigned_to__username}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{pending.device__serial_number}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px', color: '#dc2626', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px' }}>
                                        {pending.otp_code}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', color: '#6b7280' }}>
                                    {new Date(pending.created_at).toLocaleTimeString()}
                                </td>
                            </tr>
                        ))}
                        {(!data.pending_returns || data.pending_returns.length === 0) && (
                            <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#666' }}>No pending returns requiring OTP.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Active Loans */}
            <div className="card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '30px' }}>
                <h3>Active Tablet Assignments</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '10px' }}>Employee</th>
                            <th style={{ padding: '10px' }}>Device Serial</th>
                            <th style={{ padding: '10px' }}>Tab Model</th>
                            <th style={{ padding: '10px' }}>Issued At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.active_loans && data.active_loans.map((loan, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>{loan.user__username} ({loan.user__employee_id})</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{loan.device__serial_number}</td>
                                <td style={{ padding: '12px' }}>{loan.device__tab_type__name}</td>
                                <td style={{ padding: '12px' }}>{new Date(loan.issued_at).toLocaleString()}</td>
                            </tr>
                        ))}
                        {(!data.active_loans || data.active_loans.length === 0) && (
                            <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#666' }}>No active assignments.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            

            {/* RE-ADDED RECENT ACTIVITY WITH SEARCH FILTER */}
            <div className="card" style={{ maxWidth: '100%', padding: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Recent Activity</h3>
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        className="input-field"
                        style={{ margin: 0, padding: '8px 12px', width: '200px', fontSize: '13px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {data.recent_activity && data.recent_activity
                        .filter(log => 
                            log.user__username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.tab__name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((log, idx) => (
                            <li key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
                                <strong>{log.user__username}</strong> {log.quantity > 0 ? 'checked out' : 'returned'} 
                                <strong> {log.tab__name}</strong> 
                                <span style={{ color: '#6b7280', float: 'right' }}>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                            </li>
                        ))}
                    {(!data.recent_activity || data.recent_activity.length === 0) && (
                        <li style={{ padding: '10px 0', color: '#666', textAlign: 'center' }}>No recent activity.</li>
                    )}
                </ul>
            </div>

            {/* RE-ADDED ADMIN AUDIT TRAILS */}
            <div className="card" style={{ maxWidth: '100%', padding: '20px' }}>
                <h3 style={{ marginTop: 0 }}>Inventory Audit Trails</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {data.audit_trails && data.audit_trails.map((trail, idx) => (
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
                    {(!data.audit_trails || data.audit_trails.length === 0) && (
                        <p style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>No admin actions recorded.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;