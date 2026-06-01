export default function OcrMethodBadge({ method, aiEnhanced, requiresManualReview, confidence }) {
  if (requiresManualReview) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
        Manual review
      </span>
    );
  }

  if (aiEnhanced || method === "gemini") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-900">
        AI-enhanced
        {confidence != null && (
          <span className="opacity-75">· {confidence}%</span>
        )}
      </span>
    );
  }

  if (method === "pdf_text") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-900">
        PDF text
        {confidence != null && (
          <span className="opacity-75">· {confidence}%</span>
        )}
      </span>
    );
  }

  if (method === "tesseract" || method === "tesseract_fallback") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
        Standard OCR
        {confidence != null && (
          <span className="opacity-75">· {confidence}%</span>
        )}
      </span>
    );
  }

  return null;
}
