import Vendor from "@/models/Vendor";
import { validateGSTIN, validatePAN, normalizeGstin } from "@/lib/validators";

export async function validateVendorPayload(payload, excludeId) {
  const errors = [];

  if (!payload.name?.trim()) errors.push("Vendor name is required");
  if (!payload.vendorCode?.trim()) errors.push("Vendor code is required");

  if (payload.gstin?.trim()) {
    const r = validateGSTIN(payload.gstin);
    if (!r.valid) errors.push(r.error);
    else {
      const dup = await Vendor.findOne({
        gstin: normalizeGstin(payload.gstin),
        _id: { $ne: excludeId },
      }).select("_id");
      if (dup) errors.push("GSTIN already registered to another vendor");
    }
  }

  if (payload.pan?.trim()) {
    const r = validatePAN(payload.pan);
    if (!r.valid) errors.push(r.error);
  }

  if (payload.email?.trim()) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(payload.email.trim())) {
      errors.push("Invalid email address");
    }
  }

  if (payload.bankDetails?.ifsc?.trim()) {
    const ifsc = payload.bankDetails.ifsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      errors.push("Invalid IFSC code format");
    }
  }

  if (excludeId) return errors;

  const codeDup = await Vendor.findOne({
    vendorCode: payload.vendorCode.trim().toUpperCase(),
  }).select("_id");
  if (codeDup) errors.push("Vendor code already exists");

  return errors;
}

export function normalizeVendorInput(body) {
  return {
    vendorCode: body.vendorCode?.trim().toUpperCase(),
    name: body.name?.trim(),
    email: body.email?.trim().toLowerCase() || undefined,
    phone: body.phone?.trim() || undefined,
    gstin: body.gstin?.trim().toUpperCase() || undefined,
    pan: body.pan?.trim().toUpperCase() || undefined,
    tin: body.tin?.trim() || undefined,
    bankDetails: body.bankDetails
      ? {
          accountNo: body.bankDetails.accountNo?.trim(),
          ifsc: body.bankDetails.ifsc?.trim().toUpperCase(),
          bankName: body.bankDetails.bankName?.trim(),
          branch: body.bankDetails.branch?.trim(),
        }
      : undefined,
    status: body.status,
    onboardingStatus: body.onboardingStatus,
  };
}
