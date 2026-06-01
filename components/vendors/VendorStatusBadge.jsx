const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
};

const ONBOARDING_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-100 text-blue-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function VendorStatusBadge({ status, onboardingStatus }) {
  return (
    <span className="inline-flex gap-1 flex-wrap">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
      >
        {status}
      </span>
      {onboardingStatus && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ONBOARDING_STYLES[onboardingStatus] || ""}`}
        >
          {onboardingStatus}
        </span>
      )}
    </span>
  );
}
