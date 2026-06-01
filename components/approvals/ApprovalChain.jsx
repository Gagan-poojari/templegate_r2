const STATUS_DOT = {
  pending: "bg-amber-400",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  escalated: "bg-orange-500",
};

export default function ApprovalChain({ chain }) {
  if (!chain?.length) {
    return (
      <p className="text-sm text-slate-600">Not submitted for approval yet.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {chain.map((step, i) => (
        <li key={step.id || i} className="flex gap-3">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[step.status] || "bg-slate-300"}`}
          />
          <div className="text-sm">
            <p className="font-medium text-slate-900 capitalize">
              {step.role?.replace(/_/g, " ")}{" "}
              <span className="text-slate-500 font-normal">- {step.status}</span>
            </p>
            {step.userName && (
              <p className="text-slate-600">By {step.userName}</p>
            )}
            {step.remarks && (
              <p className="text-slate-600 italic">&ldquo;{step.remarks}&rdquo;</p>
            )}
            {step.timestamp && (
              <p className="text-xs text-slate-400">
                {new Date(step.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
