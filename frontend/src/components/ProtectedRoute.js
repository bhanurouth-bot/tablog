import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { token, user } = useContext(AuthContext);

    if (!token) return <Navigate to="/login" />;
    if (adminOnly && user?.role !== 'admin') return <Navigate to="/checkin" />;

    return children;
};

export default ProtectedRoute;