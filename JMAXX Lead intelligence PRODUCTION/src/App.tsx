import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Layout } from "./components/layout";

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
} from "./pages";

const SESSION_KEY = "jmaxx_dashboard_authenticated";

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setAuthenticated(true);
      return;
    }

    const expectedUser = import.meta.env.VITE_BASIC_AUTH_USER;
    const expectedPassword = import.meta.env.VITE_BASIC_AUTH_PASSWORD;

    const user = window.prompt("Utilisateur");
    if (user === null) {
      setAuthenticated(false);
      return;
    }

    const password = window.prompt("Mot de passe");
    if (password === null) {
      setAuthenticated(false);
      return;
    }

    if (user === expectedUser && password === expectedPassword) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthenticated(true);
      return;
    }

    setAuthenticated(false);
  }, []);

  if (authenticated === null) {
    return null;
  }

  if (!authenticated) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        <div>
          <h2>Accès refusé</h2>
          <p>Authentification requise.</p>
        </div>
      </div>
    );
  }

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
          <Route
            path="website-integration"
            element={<WebsiteFormTestPage />}
          />
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
