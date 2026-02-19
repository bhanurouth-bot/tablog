import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Possession = () => {
    const { token, user, logout } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/possession/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setItems(res.data);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, [token, API_BASE_URL]);

    return (
        <div className="app-container">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>My Assigned Devices</h2>
                    <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
                {/* User Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                        <button onClick={() => navigate('/assign')} className="btn-primary" style={{ flex: 1 }}>
                            📷 Check Out Tablet
                        </button>
                        <button onClick={() => navigate('/return')} className="btn-primary" style={{ flex: 1, backgroundColor: '#10b981' }}>
                            🔄 Return Tablet
                        </button>
                    </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ padding: '12px', background: '#eff6ff', color: '#1e3a8a', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                        <strong>Note:</strong> To return a device, please visit the IT desk for physical verification and OTP generation.
                    </div>

                    {loading ? (
                        <p>Loading your devices...</p>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p style={{ color: 'var(--text-muted)' }}>You currently have no devices assigned to you.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '16px', border: '1px solid #eee' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Serial: {item.device__serial_number || item.serial_number}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Model: {item.device__tab_type__name || item.tab_name}</div>
                                    </div>
                                    <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {user?.role === 'admin' && (
                        <button onClick={() => navigate('/admin/dashboard')} className="btn-primary" style={{ marginTop: '30px', backgroundColor: '#4f46e5' }}>
                            Go to Admin Dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Possession;