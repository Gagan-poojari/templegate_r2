import Invoice from "@/models/Invoice";
import Vendor from "@/models/Vendor";
import {
  validateGSTIN,
  validatePAN,
  validateAmounts,
  validateMandatoryFields,
  normalizeGstin,
  normalizePan,
} from "@/lib/validators";
import { applyPoMatch } from "@/lib/po-matching";

export async function runInvoiceValidation(invoice, options = {}) {
  const errors = [];
  const warnings = [];
  const excludeId = options.excludeId || invoice._id?.toString();

  const extracted = invoice.extractedData?.toObject?.() || invoice.extractedData || {};
  const gstin = normalizeGstin(extracted.gstin);
  const pan = extracted.pan;

  errors.push(...validateMandatoryFields(invoice));

  if (gstin) {
    const gstResult = validateGSTIN(gstin);
    if (!gstResult.valid) errors.push(gstResult.error);
  } else {
    warnings.push("No GSTIN found - add if this is a GST-registered vendor invoice");
  }

  if (pan) {
    const panResult = validatePAN(pan);
    if (!panResult.valid) errors.push(panResult.error);
  }

  const amountResult = validateAmounts({
    subtotal: extracted.subtotal,
    tax: extracted.tax,
    total: extracted.total,
  });
  errors.push(...amountResult.errors);
  warnings.push(...amountResult.warnings);

  if (invoice.vendorId) {
    const vendor = await Vendor.findById(invoice.vendorId).select("gstin pan name status");
    if (!vendor) {
      errors.push("Linked vendor not found");
    } else {
      if (vendor.status !== "active") {
        warnings.push(`Vendor "${vendor.name}" is not active (${vendor.status})`);
      }
      if (gstin && vendor.gstin && normalizeGstin(vendor.gstin) !== gstin) {
        errors.push(
          `GSTIN on invoice (${gstin}) does not match vendor record (${vendor.gstin})`
        );
      }
      if (pan && vendor.pan && normalizePan(vendor.pan) !== normalizePan(pan)) {
        warnings.push("PAN on invoice does not match vendor record");
      }
    }
  }

  if (invoice.invoiceNumber?.trim()) {
    const dupFilter = {
      invoiceNumber: invoice.invoiceNumber.trim(),
      _id: { $ne: excludeId },
    };
    if (invoice.vendorId) {
      dupFilter.vendorId = invoice.vendorId;
    } else if (gstin) {
      dupFilter["extractedData.gstin"] = gstin;
    }

    const duplicate = await Invoice.findOne(dupFilter).select("_id status");
    if (duplicate) {
      errors.push(
        `Duplicate invoice: ${invoice.invoiceNumber} already exists (status: ${duplicate.status})`
      );
    }
  }

  if (extracted.dueDate && new Date(extracted.dueDate) < new Date()) {
    warnings.push("Due date is in the past");
  }

  const uniqueErrors = [...new Set(errors)];
  const uniqueWarnings = [...new Set(warnings)];

  return {
    valid: uniqueErrors.length === 0,
    errors: uniqueErrors,
    warnings: uniqueWarnings,
  };
}

export async function applyInvoiceValidation(invoice, options = {}) {
  const result = await runInvoiceValidation(invoice, options);

  invoice.validationErrors = result.errors;
  invoice.validationWarnings = result.warnings;

  if (options.updateStatus !== false) {
    if (result.valid && options.markValidated) {
      invoice.status = "validated";
      if (invoice.poNumber?.trim()) {
        await applyPoMatch(invoice);
      }
    } else if (!result.valid && invoice.status === "validated") {
      invoice.status = "uploaded";
    }
  }

  return result;
}
