// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CheckIn from './pages/CheckIn';
import AdminDashboard from './pages/AdminDashboard';
import UserPossession from './pages/Possession';
// ADD THIS IMPORT LINE:
import ProtectedRoute from './components/ProtectedRoute'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Regular Protected Route */}
        <Route 
          path="/checkin" 
          element={
            <ProtectedRoute>
              <CheckIn />
            </ProtectedRoute>
          } 
        />

        {/* Admin-Only Protected Route */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/possession" 
          element={
            <ProtectedRoute>
              <UserPossession />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;