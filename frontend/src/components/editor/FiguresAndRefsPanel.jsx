import { useState } from "react";
import FigurePanel from "./FigurePanel";
import ReferencesPanel from "./ReferencesPanel";

export default function FiguresAndRefsPanel() {
  const [tab, setTab] = useState("figures");

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex justify-center gap-1 bg-gray-100 rounded-xl p-1 max-w-md mx-auto">
        <button
          onClick={() => setTab("figures")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            tab === "figures"
              ? "bg-white text-[#223b87] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Figuras / Cuadros / Gráficos
        </button>
        <button
          onClick={() => setTab("refs")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            tab === "refs"
              ? "bg-white text-[#223b87] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Referencias
        </button>
      </div>

      {tab === "figures" ? <FigurePanel /> : <ReferencesPanel />}
    </div>
  );
}
