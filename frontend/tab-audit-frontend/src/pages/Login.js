import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    // 1. Define the missing states
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const isSecure = window.location.protocol === 'https:';
    const API_BASE_URL = `http://${window.location.hostname}:8000`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API_BASE_URL}/api/token/`, {
                employee_id: employeeId,
                password: password
            });

            // Check if the custom backend response includes the 'user' object
            if (res.data && res.data.user) {
                login(res.data); 
                console.log("Login successful, moving to checkin...");
                navigate('/checkin');
            } else {
                setError("Profile data missing from server response.");
                console.error("Missing user object:", res.data);
            }
        } catch (err) {
            setError("Invalid Employee ID or Password.");
            console.error("Login Error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <div className="card" style={{ maxWidth: '400px' }}>
                <div className="card-header">
                    <h2>Staff Login</h2>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {error && (
                        <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}
                    
                    <input
                        className="input-field"
                        type="text"
                        placeholder="Employee ID"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                    />
                    
                    <input
                        className="input-field"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ marginTop: '12px' }}
                    />

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ marginTop: '24px' }}
                        disabled={loading}
                    >
                        {loading ? "Authenticating..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;