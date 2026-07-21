import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  DashboardPage,
  OperationsDashboardPage,
  LeadsPage,
  LeadDetailPage,
  PipelinePage,
  ActionCenterPage,
  ActivitiesPage,
  AnalyticsPage,
  SystemStatusPage,
  SettingsPage,
  ApiPage,
  LogsPage,
  WebsiteFormTestPage,
  ValidationPage,
  DeploymentPage,
  ProspectorPage,
} from './pages';

function App() {
  // 1. Estado null para evitar parpadeos visuales al verificar sesión
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState(false);

  const handleLogin = () => {
    const sessionKey = 'jmaxx_auth_session';
    const correctUser = 'jmaxxpro';
    const correctPwd = 'Suiza2026!';

    const user = prompt('👤 Usuario de acceso JMAXX:');
    const psw = prompt('🔒 Contraseña privada JMAXX:');

    if (user === correctUser && psw === correctPwd) {
      sessionStorage.setItem(sessionKey, 'true');
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const sessionKey = 'jmaxx_auth_session';
    const hasSession = sessionStorage.getItem(sessionKey);

    if (hasSession === 'true') {
      setIsAuthenticated(true);
    } else {
      handleLogin();
    }
  }, []);

  // Mientras se comprueba la sesión, la pantalla no muestra nada para una UX limpia
  if (isAuthenticated === null) {
    return null;
  }

  // 2. Pantalla de bloqueo elegante si no está autenticado o cancela el prompt
  if (!isAuthenticated) {
    return (
      <div style={{ 
        background: '#0a0a0a', 
        color: '#fff', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        fontFamily: 'sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ background: '#141414', padding: '40px', borderRadius: '12px', border: '1px solid #262626', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '10px' }}>🔒 Panel Privado JMAXX</h2>
          <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '24px' }}>
            Este sistema contiene información comercial confidencial de la empresa.
          </p>
          
          {authError && (
            <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '20px' }}>
              ❌ Credenciales incorrectas. Acceso denegado.
            </div>
          )}

          {/* 3. Botón con UX corregida según la sugerencia de GPT */}
          <button 
            onClick={handleLogin}
            style={{ 
              background: '#fff', 
              color: '#000', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e5e5e5'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
          >
            🔑 Introducir credenciales
          </button>
        </div>
      </div>
    );
  }

  // 4. Bloqueo total del BrowserRouter hasta que la sesión sea válida
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="operations" element={<OperationsDashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="actions" element={<ActionCenterPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="validation" element={<ValidationPage />} />
          <Route path="deployment" element={<DeploymentPage />} />
          <Route path="system" element={<SystemStatusPage />} />
          <Route path="website-integration" element={<WebsiteFormTestPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="api" element={<ApiPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="prospector" element={<ProspectorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
