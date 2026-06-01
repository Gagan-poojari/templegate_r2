const GSTIN_REGEX = /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b/gi;
const PAN_REGEX = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
const INVOICE_NO_REGEX =
  /(?:invoice|tax\s*invoice|bill)\s*(?:no|number|#)?[.:\s]*([A-Z0-9][A-Z0-9\-\/]{2,})/i;
const PO_REGEX = /(?:po|p\.?o\.?|purchase\s*order)\s*(?:no|number|#)?[.:\s]*([A-Z0-9][A-Z0-9\-\/]{2,})/i;
const DATE_REGEX =
  /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/g;
const AMOUNT_REGEX = /(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/gi;

function parseAmount(raw) {
  if (!raw) return null;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function findLabeledAmount(text, labels) {
  for (const label of labels) {
    const re = new RegExp(
      `${label}[:\\s]*(?:₹|rs\\.?|inr)?\\s*([\\d,]+\\.?\\d*)`,
      "i"
    );
    const m = text.match(re);
    if (m) return parseAmount(m[1]);
  }
  return null;
}

function extractLineItems(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];

  for (const line of lines) {
    const match = line.match(
      /^(.{3,50}?)\s+(\d+(?:\.\d+)?)\s+(?:₹|rs\.?)?\s*([\d,]+\.?\d*)\s+(?:₹|rs\.?)?\s*([\d,]+\.?\d*)/i
    );
    if (match) {
      items.push({
        description: match[1].trim(),
        quantity: parseFloat(match[2]),
        unitPrice: parseAmount(match[3]),
        amount: parseAmount(match[4]),
      });
    }
  }

  return items.slice(0, 50);
}

export function parseInvoiceText(ocrText) {
  const text = ocrText || "";
  const gstMatches = text.match(GSTIN_REGEX) || [];
  const panMatches = text.match(PAN_REGEX) || [];
  const invoiceMatch = text.match(INVOICE_NO_REGEX);
  const poMatch = text.match(PO_REGEX);
  const dates = [...text.matchAll(DATE_REGEX)].map((m) => m[1]);

  const subtotal =
    findLabeledAmount(text, ["sub\\s*total", "taxable\\s*value", "amount"]) ??
    null;
  const tax =
    findLabeledAmount(text, [
      "total\\s*tax",
      "gst",
      "cgst\\s*\\+\\s*sgst",
      "igst",
    ]) ?? null;
  let total =
    findLabeledAmount(text, [
      "grand\\s*total",
      "total\\s*amount",
      "amount\\s*due",
      "net\\s*payable",
    ]) ?? null;

  if (total == null) {
    const amounts = [...text.matchAll(AMOUNT_REGEX)]
      .map((m) => parseAmount(m[1]))
      .filter((n) => n != null && n > 0);
    if (amounts.length) total = Math.max(...amounts);
  }

  const lineItems = extractLineItems(text);
  const invoiceDate = parseDate(dates[0]);
  const dueDate = parseDate(dates[1]);

  const extracted = {
    invoiceDate,
    dueDate,
    lineItems,
    subtotal,
    tax,
    total,
    currency: "INR",
    gstin: gstMatches[0]?.toUpperCase() || null,
    pan: panMatches[0]?.toUpperCase() || null,
  };

  const hasCoreFields =
    Boolean(invoiceMatch?.[1] || extracted.total != null || extracted.gstin);

  return {
    invoiceNumber: invoiceMatch?.[1]?.trim() || null,
    poNumber: poMatch?.[1]?.trim() || null,
    extractedData: extracted,
    hasCoreFields,
  };
}
