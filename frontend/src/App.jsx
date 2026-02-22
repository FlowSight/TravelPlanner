import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
// PlacesPage removed from top nav — global places managed via admin only
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import ManagePage from './pages/ManagePage';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Places route removed from public nav */}
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <TripsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:id"
          element={
            <ProtectedRoute>
              <TripDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage"
          element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <ManagePage /> : <Navigate to="/trips" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={user ? '/trips' : '/login'} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
