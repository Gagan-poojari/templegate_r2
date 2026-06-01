"use client";

const COLORS = {
  uploaded: "bg-slate-400",
  ocr_processing: "bg-blue-400",
  validated: "bg-cyan-500",
  pending_approval: "bg-amber-500",
  approved: "bg-emerald-500",
  paid: "bg-indigo-600",
  rejected: "bg-red-500",
};

export default function StatusBreakdown({ items }) {
  if (!items?.length) return null;

  const total = items.reduce((s, i) => s + i.count, 0) || 1;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.status}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize text-slate-700">
              {item.status.replace(/_/g, " ")}
            </span>
            <span className="text-slate-500">
              {item.count} · ₹{item.amount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${COLORS[item.status] || "bg-slate-400"}`}
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
