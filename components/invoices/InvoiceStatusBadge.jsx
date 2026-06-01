const STYLES = {
  uploaded: "bg-slate-100 text-slate-800",
  ocr_processing: "bg-blue-100 text-blue-800",
  validated: "bg-emerald-100 text-emerald-800",
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  paid: "bg-indigo-100 text-indigo-800",
  rejected: "bg-red-100 text-red-800",
};

export default function InvoiceStatusBadge({ status }) {
  const label = (status || "unknown").replace(/_/g, " ");
  const style = STYLES[status] || "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {label}
    </span>
  );
}
