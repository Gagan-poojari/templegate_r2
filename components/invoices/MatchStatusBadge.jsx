const STYLES = {
  unmatched: "bg-slate-100 text-slate-700",
  partial: "bg-amber-100 text-amber-800",
  matched: "bg-emerald-100 text-emerald-800",
  exception: "bg-red-100 text-red-800",
};

export default function MatchStatusBadge({ status, matchType }) {
  if (!status) return null;
  const style = STYLES[status] || STYLES.unmatched;
  const typeLabel = matchType === "3way" ? "3-way" : matchType === "2way" ? "2-way" : "";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {typeLabel && <span className="opacity-75">{typeLabel}</span>}
      {status.replace(/_/g, " ")}
    </span>
  );
}
