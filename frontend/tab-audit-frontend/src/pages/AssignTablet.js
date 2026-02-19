import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Scanner from '../components/Scanner';

const AssignTablet = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [deviceId, setDeviceId] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    const handleAssign = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setMessage('');

        try {
            const res = await axios.post(`${API_BASE_URL}/api/assign/`, { device_id: deviceId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(res.data.message);
            setDeviceId('');
        } catch (err) {
            setError(err.response?.data?.error || "Assignment failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Check Out Tablet</h2>
                    <button onClick={() => navigate('/possession')} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>Cancel</button>
                </div>
                <div style={{ padding: '24px' }}>
                    {message && <div style={{ color: '#065f46', background: '#d1fae5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}
                    {error && <div style={{ color: '#991b1b', background: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

                    {isScanning ? (
                        <div style={{ marginBottom: '20px' }}>
                            <Scanner onScanSuccess={(text) => { setDeviceId(text); setIsScanning(false); }} />
                            <button className="btn-primary" style={{ backgroundColor: '#6b7280' }} onClick={() => setIsScanning(false)}>Cancel Scanner</button>
                        </div>
                    ) : (
                        <form onSubmit={handleAssign}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Scan Device QR / Serial Number</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" className="input-field" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. TAB-001" required />
                                    <button type="button" onClick={() => setIsScanning(true)} style={{ background: '#e5e7eb', border: 'none', padding: '0 15px', borderRadius: '12px', cursor: 'pointer' }}>📷 Scan</button>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Assigning...' : 'Assign to Me'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignTablet;