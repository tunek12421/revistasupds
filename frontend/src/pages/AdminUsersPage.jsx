import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  KeyRound,
  Shield,
  ShieldOff,
  X,
  Loader2,
  Check,
} from "lucide-react";
import api from "../lib/api";
import useAuthStore from "../stores/authStore";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "",
    is_admin: false,
  });

  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/admin/users", newUser);
      setShowCreate(false);
      setNewUser({ email: "", full_name: "", password: "", is_admin: false });
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al eliminar usuario");
    }
  };

  const handleToggleAdmin = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { is_admin: !user.is_admin });
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al actualizar usuario");
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { is_active: !user.is_active });
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al actualizar usuario");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPassword.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      await api.put(`/admin/users/${resetUserId}/password`, {
        password: resetPassword,
      });
      setResetUserId(null);
      setResetPassword("");
      alert("Contraseña actualizada");
    } catch (err) {
      alert(err.response?.data?.detail || "Error al actualizar contraseña");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#223b87] transition"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-700">
              Gestión de usuarios
            </span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-[#223b87] hover:bg-[#1a2f6b] text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
          >
            <Plus size={16} /> Nuevo usuario
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin text-[#223b87] mx-auto" />
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <p className="text-gray-400">No hay usuarios</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Usuario
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Rol
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Estado
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isMe = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-800">
                          {u.full_name}
                          {isMe && (
                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              tú
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                            Administrador
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Usuario
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                            Activo
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setResetUserId(u.id)}
                            className="p-1.5 text-gray-400 hover:text-[#223b87] hover:bg-gray-100 rounded transition"
                            title="Resetear contraseña"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            disabled={isMe}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.is_admin ? "Quitar admin" : "Hacer admin"}
                          >
                            {u.is_admin ? <ShieldOff size={14} /> : <Shield size={14} />}
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={isMe}
                            className={`p-1.5 rounded transition disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.is_active
                                ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                                : "text-gray-400 hover:text-green-500 hover:bg-green-50"
                            }`}
                            title={u.is_active ? "Desactivar" : "Activar"}
                          >
                            {u.is_active ? <X size={14} /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.full_name)}
                            disabled={isMe}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Nuevo usuario</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contraseña (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newUser.is_admin}
                  onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Hacer administrador</span>
              </label>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 text-sm bg-[#223b87] hover:bg-[#1a2f6b] text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {creating ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Resetear contraseña</h3>
              <button
                onClick={() => {
                  setResetUserId(null);
                  setResetPassword("");
                }}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nueva contraseña (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#223b87]"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setResetUserId(null);
                    setResetPassword("");
                  }}
                  className="flex-1 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 text-sm bg-[#223b87] hover:bg-[#1a2f6b] text-white px-4 py-2 rounded-lg transition"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
