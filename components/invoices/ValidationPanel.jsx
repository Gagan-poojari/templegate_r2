export default function ValidationPanel({ errors = [], warnings = [] }) {
  if (!errors?.length && !warnings?.length) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        All validation checks passed.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-red-900 mb-2">
            Errors ({errors.length})
          </h3>
          <ul className="text-sm text-red-800 list-disc pl-5 space-y-1">
            {errors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            Warnings ({warnings.length})
          </h3>
          <ul className="text-sm text-amber-800 list-disc pl-5 space-y-1">
            {warnings.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
