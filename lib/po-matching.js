import PurchaseOrder from "@/models/PurchaseOrder";
import GRN from "@/models/GRN";

const AMOUNT_TOLERANCE_ABS = 2;
const AMOUNT_TOLERANCE_PCT = 0.02;

function withinTolerance(actual, expected) {
  if (actual == null || expected == null) return false;
  const diff = Math.abs(actual - expected);
  if (diff <= AMOUNT_TOLERANCE_ABS) return true;
  if (expected === 0) return actual === 0;
  return diff / Math.abs(expected) <= AMOUNT_TOLERANCE_PCT;
}

function normalizeDesc(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function descriptionScore(a, b) {
  const na = normalizeDesc(a);
  const nb = normalizeDesc(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  return 0;
}

function findBestPoLine(invoiceLine, poLines) {
  let best = null;
  let bestScore = 0.4;

  for (const poLine of poLines) {
    const score = descriptionScore(invoiceLine.description, poLine.description);
    if (score > bestScore) {
      bestScore = score;
      best = poLine;
    }
  }
  return best;
}

function findGrnLine(description, grnLines) {
  let best = null;
  let bestScore = 0.4;
  for (const line of grnLines) {
    const score = descriptionScore(description, line.description);
    if (score > bestScore) {
      bestScore = score;
      best = line;
    }
  }
  return best;
}

function grnLineValue(line) {
  if (!line) return 0;
  return (line.receivedQty || 0) * (line.unitPrice || 0);
}

export async function runPoMatch(invoice) {
  const extracted = invoice.extractedData?.toObject?.() || invoice.extractedData || {};
  const invoiceLines = extracted.lineItems || [];
  const invoiceTotal = extracted.total ?? extracted.subtotal ?? 0;
  const poNumber = invoice.poNumber?.trim();
  const grnNumber = invoice.grnNumber?.trim();

  const exceptions = [];
  const lineResults = [];

  if (!poNumber) {
    return {
      matchType: null,
      matchStatus: "unmatched",
      matchDetails: {
        exceptions: ["No PO number on invoice - cannot perform matching"],
        lineSummary: { matched: 0, partial: 0, exception: 0, total: 0 },
        invoiceTotal,
        matchedAt: new Date(),
      },
    };
  }

  const po = await PurchaseOrder.findOne({ poNumber }).lean();
  if (!po) {
    return {
      matchType: "2way",
      matchStatus: "exception",
      matchDetails: {
        poNumber,
        exceptions: [`Purchase order ${poNumber} not found`],
        invoiceTotal,
        matchedAt: new Date(),
      },
    };
  }

  if (
    invoice.vendorId &&
    po.vendorId &&
    invoice.vendorId.toString() !== po.vendorId.toString()
  ) {
    exceptions.push("Invoice vendor does not match PO vendor");
  }

  let grn = null;
  if (grnNumber) {
    grn = await GRN.findOne({ grnNumber }).lean();
    if (!grn) {
      exceptions.push(`GRN ${grnNumber} not found`);
    }
  } else {
    grn = await GRN.findOne({ poNumber }).sort({ receivedDate: -1 }).lean();
  }

  const useThreeWay = Boolean(grnNumber || grn);
  const matchType = useThreeWay ? "3way" : "2way";

  if (useThreeWay && !grn) {
    return {
      matchType: "3way",
      matchStatus: "exception",
      matchDetails: {
        poNumber,
        grnNumber: grnNumber || null,
        poId: po._id,
        poTotal: po.totalAmount,
        invoiceTotal,
        exceptions: ["3-way match requires a GRN for this PO"],
        matchedAt: new Date(),
      },
    };
  }

  const headerVariance = invoiceTotal - po.totalAmount;
  const headerMatch = withinTolerance(invoiceTotal, po.totalAmount);

  if (!headerMatch) {
    exceptions.push(
      `Invoice total (${invoiceTotal}) vs PO total (${po.totalAmount}) - variance ${headerVariance.toFixed(2)}`
    );
  }

  const poLines = po.lineItems || [];
  const grnLines = grn?.lineItems || [];

  if (invoiceLines.length === 0 && poLines.length > 0) {
    lineResults.push({
      description: "(header only)",
      invoiceAmount: invoiceTotal,
      poAmount: po.totalAmount,
      status: headerMatch ? "matched" : "exception",
      message: headerMatch ? "Header totals match" : "Header totals do not match",
    });
  } else {
    for (const invLine of invoiceLines) {
      const poLine = findBestPoLine(invLine, poLines);
      const grnLine = useThreeWay ? findGrnLine(invLine.description, grnLines) : null;

      const invoiceQty = invLine.quantity ?? 0;
      const invoiceAmount = invLine.amount ?? invoiceQty * (invLine.unitPrice || 0);
      const poQty = poLine?.quantity ?? 0;
      const poAmount = poLine?.amount ?? poQty * (poLine?.unitPrice || 0);
      const grnQty = grnLine?.receivedQty ?? 0;
      const grnVal = grnLineValue(grnLine);

      let status = "exception";
      let message = "No matching PO line";

      if (poLine) {
        const qtyOk = withinTolerance(invoiceQty, poQty) || invoiceQty <= poQty;
        const amtOk = withinTolerance(invoiceAmount, poAmount);

        if (useThreeWay && grnLine) {
          const grnQtyOk = invoiceQty <= grnQty + 0.001;
          const grnAmtOk = withinTolerance(invoiceAmount, grnVal) || grnVal === 0;

          if (qtyOk && amtOk && grnQtyOk && grnAmtOk) {
            status = "matched";
            message = "Invoice, PO, and GRN align";
          } else if (qtyOk || amtOk || grnQtyOk) {
            status = "partial";
            message = "Partial 3-way match - check qty/amount vs GRN";
          } else {
            message = "Line does not match PO/GRN quantities";
          }
        } else if (useThreeWay && !grnLine) {
          status = "partial";
          message = "PO line found but no matching GRN line";
        } else if (qtyOk && amtOk) {
          status = "matched";
          message = "Invoice and PO line align";
        } else if (qtyOk || amtOk) {
          status = "partial";
          message = "Partial 2-way match on line";
        } else {
          message = "Line amount/qty mismatch with PO";
        }
      }

      lineResults.push({
        description: invLine.description || "-",
        invoiceQty,
        poQty,
        grnReceivedQty: grnQty,
        invoiceAmount,
        poAmount,
        grnValue: grnVal,
        status,
        message,
      });
    }
  }

  const summary = lineResults.reduce(
    (acc, line) => {
      acc.total += 1;
      acc[line.status] = (acc[line.status] || 0) + 1;
      return acc;
    },
    { matched: 0, partial: 0, exception: 0, unmatched: 0, total: 0 }
  );

  let matchStatus = "exception";

  if (summary.total === 0) {
    matchStatus = headerMatch ? "matched" : "exception";
  } else if (summary.matched === summary.total && headerMatch) {
    matchStatus = "matched";
  } else if (summary.matched > 0 || summary.partial > 0) {
    matchStatus = "partial";
  } else if (!headerMatch) {
    matchStatus = "exception";
  }

  if (exceptions.length && matchStatus === "matched") {
    matchStatus = "partial";
  }

  const grnValue = grnLines.reduce((sum, l) => sum + grnLineValue(l), 0);

  const matchDetails = {
    poId: po._id,
    grnId: grn?._id,
    poNumber: po.poNumber,
    grnNumber: grn?.grnNumber,
    poTotal: po.totalAmount,
    grnValue: grn ? grnValue : undefined,
    invoiceTotal,
    headerVariance,
    headerMatch,
    lineMatches: lineResults,
    lineSummary: summary,
    exceptions,
    matchedAt: new Date(),
  };

  return { matchType, matchStatus, matchDetails };
}

export async function applyPoMatch(invoice) {
  const result = await runPoMatch(invoice);

  invoice.matchType = result.matchType;
  invoice.matchStatus = result.matchStatus;
  invoice.matchDetails = result.matchDetails;

  if (result.matchDetails?.poId) {
    const po = await PurchaseOrder.findById(result.matchDetails.poId);
    if (po) {
      if (result.matchStatus === "matched") {
        po.status = "fully_matched";
      } else if (result.matchStatus === "partial") {
        po.status = "partially_matched";
      }
      await po.save();
    }
  }

  return result;
}
