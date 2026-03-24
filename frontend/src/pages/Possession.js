import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Possession = () => {
    const { token, user, logout } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Transfer Modal States
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receiveOtp, setReceiveOtp] = useState('');

    const navigate = useNavigate();
    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    const fetchPossessions = useCallback(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/api/possession/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setItems(res.data);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, [token, API_BASE_URL]);

    useEffect(() => {
        fetchPossessions();
    }, [fetchPossessions]);

    // --- SEND (INITIATE) TRANSFER ---
    const handleSendTransfer = async (deviceId) => {
        if (!window.confirm("Generate a Transfer OTP for this device?")) return;
        
        try {
            const res = await axios.post(`${API_BASE_URL}/api/transfer/initiate/`, 
                { device_id: deviceId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Show the generated OTP to the sender
            window.alert(`✅ TRANSFER CODE GENERATED\n\nCode: ${res.data.transfer_otp}\n\n${res.data.instructions}`);
        } catch (err) {
            window.alert(err.response?.data?.error || "Failed to initiate transfer.");
        }
    };

    // --- RECEIVE (ACCEPT) TRANSFER ---
    const handleAcceptTransfer = async () => {
        if (!receiveOtp || receiveOtp.length !== 6) {
            window.alert("Please enter a valid 6-digit code.");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/transfer/accept/`, 
                { otp_code: receiveOtp },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            window.alert(`🎉 Success: ${res.data.message}`);
            setShowReceiveModal(false);
            setReceiveOtp('');
            
            // Refresh the list to show the newly acquired tablet
            fetchPossessions(); 
        } catch (err) {
            window.alert(err.response?.data?.error || "Invalid or expired OTP.");
        }
    };

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
                <div style={{ display: 'flex', gap: '10px', marginTop: '30px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/assign')} className="btn-primary" style={{ flex: 1, minWidth: '130px' }}>
                        📷 Check Out
                    </button>
                    <button onClick={() => navigate('/return')} className="btn-primary" style={{ flex: 1, backgroundColor: '#10b981', minWidth: '130px' }}>
                        🔄 Return
                    </button>
                    {/* NEW RECEIVE TRANSFER BUTTON */}
                    <button onClick={() => setShowReceiveModal(true)} className="btn-primary" style={{ flex: 1, backgroundColor: '#3b82f6', minWidth: '130px' }}>
                        📥 Receive Tab
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ padding: '12px', background: '#eff6ff', color: '#1e3a8a', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                        <strong>Note:</strong> To return a device to the warehouse, visit the IT desk. To give it to a coworker, click Send.
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
                                    
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {/* NEW SEND BUTTON */}
                                        <button 
                                            onClick={() => handleSendTransfer(item.device__serial_number || item.serial_number)}
                                            style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                            📤 Send
                                        </button>
                                        
                                        <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Active
                                        </span>
                                    </div>
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

            {/* RECEIVE OTP MODAL */}
            {showReceiveModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#111827' }}>Receive Transferred Tab</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Enter the 6-digit OTP provided by the sender.</p>
                        
                        <input 
                            type="number" 
                            placeholder="000000" 
                            value={receiveOtp}
                            onChange={(e) => setReceiveOtp(e.target.value)}
                            className="input-field"
                            style={{ fontSize: '24px', letterSpacing: '4px', textAlign: 'center', padding: '12px', margin: 0, width: '100%' }}
                            maxLength={6}
                        />
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setShowReceiveModal(false)} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#374151' }}>
                                Cancel
                            </button>
                            <button onClick={handleAcceptTransfer} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Claim Tablet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Possession;