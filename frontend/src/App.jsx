import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./stores/authStore";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import AdminUsersPage from "./pages/AdminUsersPage";

function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const initializing = useAuthStore((s) => s.initializing);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show a loading screen or nothing while initializing
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-500"></div>
          <p className="mt-4 text-gray-600 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      {/* /register removed: only admins can create accounts */}
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/:id"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
