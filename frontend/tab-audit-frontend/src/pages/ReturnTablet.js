import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Scanner from '../components/Scanner';

const ReturnTablet = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [deviceId, setDeviceId] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); 
    const [isScanning, setIsScanning] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    const handleInitiate = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/return/initiate/`, { device_id: deviceId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(response.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to initiate return.');
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError(''); setMessage('');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/return/verify/`, { 
                device_id: deviceId, 
                otp_code: otp, 
                condition: "Good" 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(response.data.success);
            setTimeout(() => { navigate('/possession'); }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to verify OTP.');
        }
    };

    return (
        <div className="app-container">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Return Tablet</h2>
                    <button onClick={() => navigate('/possession')} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>Cancel</button>
                </div>
                <div style={{ padding: '24px' }}>
                    {message && <div style={{ color: '#065f46', background: '#d1fae5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}
                    {error && <div style={{ color: '#991b1b', background: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

                    {step === 1 ? (
                        isScanning ? (
                            <div style={{ marginBottom: '20px' }}>
                                <Scanner onScanSuccess={(text) => { setDeviceId(text); setIsScanning(false); }} />
                                <button className="btn-primary" style={{ backgroundColor: '#6b7280' }} onClick={() => setIsScanning(false)}>Cancel Scanner</button>
                            </div>
                        ) : (
                            <div>
                                <form onSubmit={handleInitiate}>
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Scan Device to Return</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="text" className="input-field" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. TAB-001" required />
                                            <button type="button" onClick={() => setIsScanning(true)} style={{ background: '#e5e7eb', border: 'none', padding: '0 15px', borderRadius: '12px', cursor: 'pointer' }}>📷 Scan</button>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary">Initiate Return</button>
                                </form>

                                {/* NEW: Skip directly to OTP input */}
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>Already requested a return?</p>
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)} 
                                        style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                                    >
                                        Enter OTP Directly
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <form onSubmit={handleVerify}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Device ID / Serial Number</label>
                                <input type="text" className="input-field" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. TAB-001" required />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Admin OTP</label>
                                <input type="text" className="input-field" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Ask Admin for 6-digit code" required />
                            </div>
                            <button type="submit" className="btn-primary" style={{ backgroundColor: '#10b981' }}>Verify & Complete Return</button>
                            
                            {/* NEW: Back button */}
                            <button type="button" onClick={() => {setStep(1); setMessage(''); setError('');}} style={{ width: '100%', marginTop: '10px', padding: '12px', background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Back to Scan</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReturnTablet;