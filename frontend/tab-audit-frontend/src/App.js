// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserPossession from './pages/Possession';
import AssignTablet from './pages/AssignTablet';
import ReturnTablet from './pages/ReturnTablet';
import AssignmentLogs from './pages/AssignmentLogs';

// Import Components
import ProtectedRoute from './components/ProtectedRoute'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route redirects to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* ==========================================
            USER PROTECTED ROUTES (Self-Service)
            ========================================== */}
        <Route 
          path="/possession" 
          element={
            <ProtectedRoute>
              <UserPossession />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assign" 
          element={
            <ProtectedRoute>
              <AssignTablet />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/return" 
          element={
            <ProtectedRoute>
              <ReturnTablet />
            </ProtectedRoute>
          } 
        />

        {/* Redirect legacy check-in route to possession so old bookmarks don't break */}
        <Route path="/checkin" element={<Navigate to="/possession" replace />} />

        {/* ==========================================
            ADMIN-ONLY PROTECTED ROUTES
            ========================================== */}
        <Route 
          path="/admin/dashboard" 
          element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/logs" 
          element={<ProtectedRoute adminOnly={true}><AssignmentLogs /></ProtectedRoute>} 
        />
        
      </Routes>
    </Router>
  );
}

export default App;