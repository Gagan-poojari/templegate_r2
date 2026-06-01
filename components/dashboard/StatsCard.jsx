export default function StatsCard({ label, value, subtext, accent }) {
  const accents = {
    default: "border-slate-200",
    amber: "border-amber-200 bg-amber-50/50",
    emerald: "border-emerald-200 bg-emerald-50/50",
    red: "border-red-200 bg-red-50/50",
    blue: "border-blue-200 bg-blue-50/50",
  };

  return (
    <div
      className={`rounded-xl border p-5 ${accents[accent] || accents.default} bg-white`}
    >
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}
