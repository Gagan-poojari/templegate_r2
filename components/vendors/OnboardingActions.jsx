"use client";

export default function OnboardingActions({
  vendor,
  userRole,
  onAction,
  loading,
}) {
  if (!vendor) return null;

  const canReview = ["admin", "vendor_manager"].includes(userRole);
  const { onboardingStatus } = vendor;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Onboarding</h3>
      <p className="text-sm text-slate-600">
        Draft → submit for review → vendor manager verifies → active.
      </p>
      <div className="flex flex-wrap gap-2">
        {onboardingStatus === "draft" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onAction("submit")}
            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            Submit for review
          </button>
        )}
        {onboardingStatus === "submitted" && canReview && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => onAction("verify")}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              Verify & activate
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onAction("reject")}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {onboardingStatus === "verified" && (
          <p className="text-sm text-emerald-700">Onboarding complete - vendor is active.</p>
        )}
        {onboardingStatus === "rejected" && (
          <p className="text-sm text-red-700">Onboarding rejected. Update details and resubmit.</p>
        )}
      </div>
    </div>
  );
}
