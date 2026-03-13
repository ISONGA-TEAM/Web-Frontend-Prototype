import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './i18n';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HouseholdRegistry from './pages/HouseholdRegistry';
import HouseholdDetail from './pages/HouseholdDetail';
import RegistrationForm from './pages/RegistrationForm';
import LivestockMonitoring from './pages/LivestockMonitoring';
import ImihigoAnalytics from './pages/ImihigoAnalytics';
import CitizenMessages from './pages/CitizenMessages';
import AdminPanel from './pages/AdminPanel';
import HGIPrograms from './pages/HGIPrograms';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/households" element={<HouseholdRegistry />} />
            <Route path="/households/:id" element={<HouseholdDetail />} />
            <Route path="/households/register" element={<RegistrationForm />} />
            <Route path="/programs" element={<HGIPrograms />} />
            <Route path="/livestock" element={<LivestockMonitoring />} />
            <Route path="/messages" element={<CitizenMessages />} />
            <Route path="/reports" element={<ImihigoAnalytics />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
