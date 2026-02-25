import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AssignmentLogs = () => {
    const { token } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // TOGGLE STATE: 'filtered' (Old view) or 'detailed' (New event view)
    const [viewMode, setViewMode] = useState('filtered');

    // FILTER STATES
    const [filterDate, setFilterDate] = useState('');
    const [filterTab, setFilterTab] = useState('');
    const [filterUser, setFilterUser] = useState('');

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

    const uniqueTabs = [...new Set(logs.map(log => log.tab_model))];

    const clearFilters = () => {
        setFilterDate('');
        setFilterTab('');
        setFilterUser('');
    };

    // ==========================================
    // LOGIC 1: FILTERED VIEW (Classic - 1 Row per Assignment)
    // ==========================================
    const classicFilteredLogs = logs.filter(log => {
        const matchUser = filterUser === '' || 
                          log.username.toLowerCase().includes(filterUser.toLowerCase()) ||
                          log.employee_id.toLowerCase().includes(filterUser.toLowerCase());
        const matchTab = filterTab === '' || log.tab_model === filterTab;
        let matchDate = true;
        if (filterDate) {
            const logDate = new Date(log.issued_at).toISOString().split('T')[0]; 
            matchDate = logDate === filterDate;
        }
        return matchUser && matchTab && matchDate;
    });

    // ==========================================
    // LOGIC 2: DETAILED VIEW (Events - Split Checkout/Return)
    // ==========================================
    const eventLogs = [];
    logs.forEach(log => {
        if (log.issued_at) {
            eventLogs.push({
                ...log, action_type: 'Checked Out', event_time: log.issued_at, unique_id: `${log.id}-out`
            });
        }
        if (log.status === 'returned' && log.returned_at) {
            eventLogs.push({
                ...log, action_type: 'Returned', event_time: log.returned_at, unique_id: `${log.id}-in`
            });
        }
    });
    eventLogs.sort((a, b) => new Date(b.event_time) - new Date(a.event_time));

    const detailedFilteredLogs = eventLogs.filter(log => {
        const matchUser = filterUser === '' || 
                          log.username.toLowerCase().includes(filterUser.toLowerCase()) ||
                          log.employee_id.toLowerCase().includes(filterUser.toLowerCase());
        const matchTab = filterTab === '' || log.tab_model === filterTab;
        let matchDate = true;
        if (filterDate) {
            const logDate = new Date(log.event_time).toISOString().split('T')[0]; 
            matchDate = logDate === filterDate;
        }
        return matchUser && matchTab && matchDate;
    });

    // ==========================================
    // SMART EXPORT TO CSV / EXCEL
    // ==========================================
    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";

        if (viewMode === 'filtered') {
            // Header for Filtered View
            csvContent += "Status,Employee Name,Employee ID,Device Serial,Model,Issued At,Returned At\n";
            classicFilteredLogs.forEach(log => {
                const issued = log.issued_at ? new Date(log.issued_at).toLocaleString().replace(/,/g, '') : '';
                const returned = log.returned_at ? new Date(log.returned_at).toLocaleString().replace(/,/g, '') : 'Pending';
                const row = `${log.status === 'active' ? 'Active' : 'Returned'},${log.username},${log.employee_id},${log.serial_number},${log.tab_model},${issued},${returned}`;
                csvContent += row + "\n";
            });
        } else {
            // Header for Detailed Event View
            csvContent += "Action,Timestamp,Employee Name,Employee ID,Device Serial,Model\n";
            detailedFilteredLogs.forEach(log => {
                const eventTime = new Date(log.event_time).toLocaleString().replace(/,/g, '');
                const row = `${log.action_type},${eventTime},${log.username},${log.employee_id},${log.serial_number},${log.tab_model}`;
                csvContent += row + "\n";
            });
        }

        // Create a downloadable link and click it programmatically
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Tablet_Audit_${viewMode}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="app-container" style={{ maxWidth: '1100px', display: 'block', margin: '0 auto' }}>
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>System Audit Logs</h2>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* NEW SMART EXPORT BUTTON */}
                        <button 
                            onClick={handleExportCSV} 
                            style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            📥 Export to Excel/CSV
                        </button>

                        <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}>Back to Dashboard</button>
                    </div>
                </div>

                {/* VIEW TOGGLE TABS */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <button 
                        style={{ flex: 1, padding: '15px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', border: 'none', background: viewMode === 'filtered' ? 'white' : 'transparent', borderBottom: viewMode === 'filtered' ? '3px solid #3b82f6' : '3px solid transparent', color: viewMode === 'filtered' ? '#1d4ed8' : '#6b7280' }}
                        onClick={() => setViewMode('filtered')}
                    >
                        📊 Filtered View (Combined)
                    </button>
                    <button 
                        style={{ flex: 1, padding: '15px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', border: 'none', background: viewMode === 'detailed' ? 'white' : 'transparent', borderBottom: viewMode === 'detailed' ? '3px solid #10b981' : '3px solid transparent', color: viewMode === 'detailed' ? '#047857' : '#6b7280' }}
                        onClick={() => setViewMode('detailed')}
                    >
                        ⏱️ Detailed View (Event Timeline)
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* FILTER TOOLBAR */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', background: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '5px' }}>Day-Wise Filter</label>
                            <input type="date" className="input-field" style={{ margin: 0 }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '5px' }}>Tab-Wise Filter</label>
                            <select className="input-field" style={{ margin: 0 }} value={filterTab} onChange={(e) => setFilterTab(e.target.value)}>
                                <option value="">All Models</option>
                                {uniqueTabs.map((tab, idx) => <option key={idx} value={tab}>{tab}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '5px' }}>User-Wise Filter</label>
                            <input type="text" placeholder="Search Name or Emp ID..." className="input-field" style={{ margin: 0 }} value={filterUser} onChange={(e) => setFilterUser(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button onClick={clearFilters} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}>Clear Filters</button>
                        </div>
                    </div>

                    {/* DATA TABLES */}
                    {loading ? (
                        <p>Loading logs...</p>
                    ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                
                                {/* ---------------- FILTERED VIEW HEADERS ---------------- */}
                                {viewMode === 'filtered' && (
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
                                )}

                                {/* ---------------- DETAILED VIEW HEADERS ---------------- */}
                                {viewMode === 'detailed' && (
                                    <thead>
                                        <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                                            <th style={{ padding: '12px' }}>Action</th>
                                            <th style={{ padding: '12px' }}>Timestamp</th>
                                            <th style={{ padding: '12px' }}>Employee</th>
                                            <th style={{ padding: '12px' }}>Device Serial</th>
                                            <th style={{ padding: '12px' }}>Model</th>
                                        </tr>
                                    </thead>
                                )}

                                <tbody>
                                    {/* ---------------- FILTERED VIEW ROWS ---------------- */}
                                    {viewMode === 'filtered' && classicFilteredLogs.map((log) => (
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
                                    {viewMode === 'filtered' && classicFilteredLogs.length === 0 && (
                                        <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No combined logs match your filters.</td></tr>
                                    )}

                                    {/* ---------------- DETAILED VIEW ROWS ---------------- */}
                                    {viewMode === 'detailed' && detailedFilteredLogs.map((log) => (
                                        <tr key={log.unique_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '12px' }}>
                                                {log.action_type === 'Checked Out' 
                                                    ? <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>📤 Checked Out</span>
                                                    : <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>📥 Returned</span>
                                                }
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#374151' }}>
                                                {new Date(log.event_time).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px' }}>{log.username} <br/><span style={{color: '#6b7280', fontSize: '12px'}}>{log.employee_id}</span></td>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.serial_number}</td>
                                            <td style={{ padding: '12px' }}>{log.tab_model}</td>
                                        </tr>
                                    ))}
                                    {viewMode === 'detailed' && detailedFilteredLogs.length === 0 && (
                                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No timeline events match your filters.</td></tr>
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