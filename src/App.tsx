import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import './i18n';
import Login from './pages/Login';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import { appRoutes } from './routes';

const App: React.FC = () => (
    <AuthProvider>
        <StoreProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route element={<Layout />}>{appRoutes()}</Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
        </StoreProvider>
    </AuthProvider>
);

export default App;
