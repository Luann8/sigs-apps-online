import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConvexProvider } from 'convex/react';
import { convex } from './lib/convex';
import { ThemeProvider } from './theme/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EstabelecimentosPage } from './pages/EstabelecimentosPage';
import { LicencasPage } from './pages/LicencasPage';
import { DetalheLicencaPage } from './pages/DetalheLicencaPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { AlertasPage } from './pages/AlertasPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { LoginPage } from './pages/LoginPage';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <ThemeProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/estabelecimentos" element={<EstabelecimentosPage />} />
                <Route path="/licencas" element={<LicencasPage />} />
                <Route path="/licencas/:id" element={<DetalheLicencaPage />} />
                <Route path="/calendario" element={<CalendarioPage />} />
                <Route path="/alertas" element={<AlertasPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </ConvexProvider>
    </ErrorBoundary>
  );
}
