import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Possession = () => {
    const { token } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null); 
    const navigate = useNavigate();

    // Dynamically detect protocol and host to avoid Mixed Content errors
    const isSecure = window.location.protocol === 'https:';
    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    const fetchPossessions = () => {
        axios.get(`${API_BASE_URL}/api/possession/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setItems(res.data);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchPossessions();
    }, [token]);

    const handleQuickReturn = async (tabId) => {
        setProcessingId(tabId);
        try {
            await axios.post(`${API_BASE_URL}/api/check-in/`, 
                { tab_id: tabId, action: 'return' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPossessions();
        } catch (err) {
            alert(err.response?.data?.error || "Return failed.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="app-container">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>My Active Tabs</h2>
                    <button onClick={() => navigate('/checkin')} style={{ background: 'white', color: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Back
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {loading ? (
                        <p>Loading...</p>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Inventory clear! No tabs held.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {items.map(item => (
                                <div key={item.tab__id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '16px', border: '1px solid #eee' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.tab__name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>Quantity: {item.current_balance}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleQuickReturn(item.tab__id)}
                                        disabled={processingId === item.tab__id}
                                        style={{ 
                                            backgroundColor: '#10b981', 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '8px 16px', 
                                            borderRadius: '10px', 
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {processingId === item.tab__id ? "..." : "Return"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Possession;