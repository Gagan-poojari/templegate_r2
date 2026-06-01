export function isGeminiQuotaError(err) {
  const msg = String(err?.message || err || "");
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("Quota exceeded")
  );
}

export function formatOcrErrorForUser(err) {
  const msg = String(err?.message || err || "");

  if (isGeminiQuotaError(err)) {
    return (
      "Gemini free-tier quota is temporarily exceeded. The app will use PDF text extraction when possible — click Re-run OCR after ~1 minute, or enter fields manually."
    );
  }

  if (msg.includes("GEMINI_API_KEY")) {
    return msg;
  }

  if (msg.includes("[GoogleGenerativeAI Error]")) {
    return "AI OCR failed. Try Re-run OCR later or enter invoice details manually.";
  }

  if (msg.length > 280) {
    return "OCR failed. Try Re-run OCR or enter details manually.";
  }

  return msg;
}
