import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AssignmentLogs = () => {
    const { token } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/logs/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setLogs(res.data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Logs Load Error:", err);
            setLoading(false);
        });
    }, [token, API_BASE_URL]);

    // Filter logic for search bar
    const filteredLogs = logs.filter(log => 
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="app-container" style={{ maxWidth: '1000px', display: 'block', margin: '0 auto' }}>
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>All Assignment Logs</h2>
                    <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>Back to Dashboard</button>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <input 
                            type="text" 
                            placeholder="Search by User, Serial, or Status..." 
                            className="input-field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <p>Loading logs...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Employee</th>
                                        <th style={{ padding: '12px' }}>Device Serial</th>
                                        <th style={{ padding: '12px' }}>Model</th>
                                        <th style={{ padding: '12px' }}>Issued At</th>
                                        <th style={{ padding: '12px' }}>Returned At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log, idx) => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '12px' }}>
                                                {log.status === 'active' 
                                                    ? <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>Active</span>
                                                    : <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>Returned</span>
                                                }
                                            </td>
                                            <td style={{ padding: '12px' }}>{log.username} <br/><span style={{color: '#6b7280', fontSize: '12px'}}>{log.employee_id}</span></td>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.serial_number}</td>
                                            <td style={{ padding: '12px' }}>{log.tab_model}</td>
                                            <td style={{ padding: '12px' }}>{new Date(log.issued_at).toLocaleString()}</td>
                                            <td style={{ padding: '12px' }}>{log.returned_at ? new Date(log.returned_at).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr><td colSpan="6" style={{ padding: '12px', textAlign: 'center', color: '#666' }}>No logs found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignmentLogs;