import { Check } from "lucide-react";

const STEPS = [
  { num: 1, label: "Tipo y título" },
  { num: 2, label: "Autores" },
  { num: 3, label: "Resumen" },
  { num: 4, label: "Contenido" },
  { num: 5, label: "Figuras y refs" },
  { num: 6, label: "Revisar" },
];

export default function StepIndicator({ current }) {
  return (
    <nav className="w-full px-4 py-1.5">
      <ol className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, i) => {
          const isCompleted = current > step.num;
          const isActive = current === step.num;
          const isLast = i === STEPS.length - 1;

          return (
            <li key={step.num} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-[#223b87] text-white ring-2 ring-[#223b87]/20"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                </div>
                <span
                  className={`mt-0.5 text-[10px] font-medium whitespace-nowrap ${
                    isActive
                      ? "text-[#223b87]"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-px mx-1.5 mt-[-14px] transition-all ${
                    isCompleted ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
