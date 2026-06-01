export const USER_ROLES = [
  "admin",
  "ap_clerk",
  "approver_l1",
  "approver_l2",
  "cfo",
  "vendor_manager",
];

export const INVOICE_STATUSES = [
  "uploaded",
  "ocr_processing",
  "validated",
  "pending_approval",
  "approved",
  "paid",
  "rejected",
];

export const MATCH_TYPES = ["2way", "3way"];

export const MATCH_STATUSES = [
  "unmatched",
  "partial",
  "matched",
  "exception",
];

export const VENDOR_STATUSES = ["active", "inactive", "pending"];

export const ONBOARDING_STATUSES = [
  "draft",
  "submitted",
  "verified",
  "rejected",
];

export const PO_STATUSES = [
  "open",
  "partially_matched",
  "fully_matched",
  "closed",
];

export const GRN_STATUSES = ["open", "partial", "closed"];

export const PAYMENT_METHODS = ["bank_transfer", "cheque", "upi"];

export const PAYMENT_STATUSES = ["pending", "processed", "failed"];

export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "escalated"];
