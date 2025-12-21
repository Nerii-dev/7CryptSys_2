import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./pages/Auth/Login";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { SalesManagementComponent } from "./pages/Vendas/SalesManagementComponent";
import { TasksManagementComponent } from "./pages/Tarefas/TasksManagementComponent";
import { ShippingComponent } from "./pages/Expedicao/ShippingComponent";
import { MetricsDashboardComponent } from "./pages/Metricas/MetricsDashboardComponent";
import { SettingsComponent } from "./pages/Settings/SettingsComponent";

const PublicRoute = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  return !currentUser ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  
  return currentUser ? (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>

        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesManagementComponent />} />
          <Route path="/shipping" element={<ShippingComponent />} />
          <Route path="/tasks" element={<TasksManagementComponent />} />
          <Route path="/metrics" element={<MetricsDashboardComponent />} />
          <Route path="/settings" element={<SettingsComponent />} /> {/* ATUALIZADO */}
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;