import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTelemetryStore } from './store/useTelemetryStore';

// Views [Gate 0 to Route 2]
import LoginView from './views/LoginView';
import ClientView from './views/ClientView';
import SupervisorView from './views/SupervisorView';

// Industrial Guards
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role: string }) => {
  const user = useTelemetryStore(state => state.user);

  if (!user) return <Navigate to="/login" />;

  // Role Authorization Check
  if (role !== 'any' && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/supervisor' : '/client'} />;
  }

  return <>{children}</>;
};

export default function App() {
  const user = useTelemetryStore(state => state.user);

  return (
    <div className="NOC-Terminal bg-bg-deep min-h-screen selection:bg-accent-cyan/30 selection:text-white">
      <Routes>
        {/* Gate 0: Unified Auth Portal */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/supervisor' : '/client'} /> : <LoginView />} />

        {/* Route 1: Client Portal [Nexus Overview + 3D Simulator] */}
        <Route
          path="/client"
          element={
            <ProtectedRoute role="client">
              <ClientView />
            </ProtectedRoute>
          }
        />

        {/* Route 2: Supervisor NOC [Mission Control + MLOps] */}
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute role="admin">
              <SupervisorView />
            </ProtectedRoute>
          }
        />

        {/* Default Forwarding Node */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
