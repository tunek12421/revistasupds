import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  FileText,
  Loader2,
  Users,
} from "lucide-react";
import useAuthStore from "../stores/authStore";
import useArticleStore from "../stores/articleStore";
import api from "../lib/api";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetArticle = useArticleStore((s) => s.reset);
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/articles");
      setArticles(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleNew = () => {
    resetArticle();
    navigate("/editor");
  };

  const handleEdit = (id) => {
    navigate(`/editor/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este artículo?"))
      return;
    try {
      await api.delete(`/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Error al eliminar el artículo");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusLabel = (status) => {
    const map = {
      draft: { text: "Borrador", cls: "bg-yellow-100 text-yellow-800" },
      published: { text: "Publicado", cls: "bg-green-100 text-green-800" },
    };
    const s = map[status] || { text: status, cls: "bg-gray-100 text-gray-800" };
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}
      >
        {s.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-500 tracking-tight">
            EARL{" "}
            <span className="text-sm font-normal text-gray-500">
              — Formateador de Artículos
            </span>
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user.full_name}
                {user.is_admin && (
                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    admin
                  </span>
                )}
              </span>
            )}
            {user?.is_admin && (
              <button
                onClick={() => navigate("/admin/users")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#223b87] transition"
              >
                <Users size={16} />
                Usuarios
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Mis Artículos
          </h2>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-5 rounded-lg transition shadow-sm"
          >
            <Plus size={18} />
            Nuevo Artículo
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg">
              No tienes artículos todavía
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Haz clic en "Nuevo Artículo" para empezar
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actualizado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {article.title_es || "Sin título"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {article.doc_type}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {statusLabel(article.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(article.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(article.id)}
                          className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
