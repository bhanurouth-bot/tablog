import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import SuccessScreen from '../components/SuccessScreen';
import Scanner from '../components/Scanner';

const CheckIn = () => {
    const navigate = useNavigate();
    const { token, user, logout } = useContext(AuthContext); 
    
    const [tabs, setTabs] = useState([]);
    const [history, setHistory] = useState([]); // State for personal history
    const [selectedTab, setSelectedTab] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState('form');
    const [resultData, setResultData] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // Dynamic resolution for LAN-only setup
    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    // Fetch inventory and personal history on load
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [tabsRes, historyRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/check-in/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/api/user/history/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setTabs(tabsRes.data);
                setHistory(historyRes.data);
            } catch (err) {
                setError("Could not load data. Check your connection.");
            }
        };

        fetchData();
    }, [token, navigate, step, API_BASE_URL]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleScanSuccess = (decodedText) => {
        setSelectedTab(decodedText);
        setIsScanning(false);
    };

    const handleAction = async (actionType) => {
        if (!selectedTab) {
            setError("Please select a tab or scan a barcode first.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/check-in/`, 
                { tab_id: selectedTab, action: actionType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResultData(res.data);
            setStep('success');
        } catch (err) {
            setError(err.response?.data?.error || "Action failed.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <SuccessScreen 
                remainingStock={resultData?.remaining_stock} 
                branchName="Main Warehouse" 
                onReset={() => setStep('form')} 
            />
        );
    }

    return (
        <div className="app-container">
            <div className="card">
                <div className="card-header" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '16px 24px' 
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                        {isScanning ? "Scanner" : "Management"}
                    </h2>
                    <button 
                        onClick={handleLogout}
                        style={{ 
                            background: 'rgba(255,255,255,0.2)', 
                            border: '1px solid rgba(255,255,255,0.4)', 
                            color: 'white', 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
                
                <div style={{ padding: '24px' }}>
                    {error && (
                        <div style={{ color: 'var(--error-text)', background: 'var(--error-bg)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    {isScanning ? (
                        <div>
                            <Scanner onScanSuccess={handleScanSuccess} />
                            <button className="btn-primary" style={{ backgroundColor: '#6b7280', marginTop: '15px' }} onClick={() => setIsScanning(false)}>
                                Cancel Scanner
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button className="btn-primary" style={{ backgroundColor: '#4f46e5', marginBottom: '20px' }} onClick={() => setIsScanning(true)}>
                                📷 Open Scanner
                            </button>

                            <select className="input-field" style={{ marginBottom: '24px' }} value={selectedTab} onChange={(e) => setSelectedTab(e.target.value)}>
                                <option value="">-- Choose Tab Type --</option>
                                {tabs.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.stock_remaining} left)</option>
                                ))}
                            </select>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-primary" onClick={() => handleAction('log')} disabled={loading || !selectedTab}>Log Usage</button>
                                <button className="btn-primary" style={{ backgroundColor: '#10b981' }} onClick={() => handleAction('return')} disabled={loading || !selectedTab}>Return Tab</button>
                            </div>

                            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #eee' }} />
                            
                            {/* Personal History Section */}
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>My Recent Activity</h4>
                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {history.map((h, i) => (
                                        <div key={i} style={{ fontSize: '12px', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                            <span style={{ fontWeight: 'bold', color: h.action === 'Logged' ? 'var(--primary)' : '#10b981' }}>{h.action}</span> - {h.tab_name} 
                                            <span style={{ float: 'right', color: '#999' }}>{new Date(h.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    ))}
                                    {history.length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>No recent activity.</p>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                                <button onClick={() => navigate('/possession')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                                    📋 My Active Possessions
                                </button>
                                {user?.role === 'admin' && (
                                    <button onClick={() => navigate('/admin/dashboard')} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                        📊 Admin Dashboard
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckIn;