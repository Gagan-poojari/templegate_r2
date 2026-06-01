import ApprovalWorkflow from "@/models/ApprovalWorkflow";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { sendMail, invoiceApprovalEmail } from "@/lib/mailer";

export function getInvoiceAmount(invoice) {
  const extracted = invoice.extractedData?.toObject?.() || invoice.extractedData || {};
  return Number(extracted.total) || 0;
}

export async function getDefaultWorkflow() {
  let workflow = await ApprovalWorkflow.findOne({ isDefault: true });
  if (!workflow) {
    workflow = await ApprovalWorkflow.create({
      name: "Standard AP Approval",
      isDefault: true,
      rules: [
        {
          amountMin: 0,
          amountMax: 10000,
          approvers: ["approver_l1"],
          escalationAfterHours: 48,
        },
        {
          amountMin: 10000,
          amountMax: 100000,
          approvers: ["approver_l1", "approver_l2"],
          escalationAfterHours: 48,
        },
        {
          amountMin: 100000,
          amountMax: Number.MAX_SAFE_INTEGER,
          approvers: ["approver_l1", "approver_l2", "cfo"],
          escalationAfterHours: 24,
        },
      ],
    });
  }
  return workflow;
}

export function findRuleForAmount(workflow, amount) {
  const rules = [...(workflow.rules || [])].sort(
    (a, b) => a.amountMin - b.amountMin
  );
  return rules.find(
    (r) => amount >= r.amountMin && amount <= r.amountMax
  );
}

export function getActivePendingStep(invoice) {
  return (invoice.approvalChain || []).find((s) => s.status === "pending");
}

export function canUserActOnStep(user, step) {
  if (!step || step.status !== "pending") return false;
  if (user.role === "admin") return true;
  return user.role === step.role;
}

export async function applyEscalationIfNeeded(invoice) {
  const step = getActivePendingStep(invoice);
  if (!step?.activatedAt || step.status !== "pending") return false;

  const hours = step.escalationAfterHours || 48;
  const deadline = new Date(
    step.activatedAt.getTime() + hours * 60 * 60 * 1000
  );

  if (new Date() <= deadline) return false;

  step.status = "escalated";
  invoice.markModified("approvalChain");

  const admins = await User.find({
    role: { $in: ["admin", "cfo"] },
    isActive: true,
  }).select("name email role");

  for (const admin of admins) {
    const mail = invoiceApprovalEmail({
      approver: admin,
      invoice,
      action: "escalation",
    });
    await sendMail(mail);
  }

  return true;
}

async function notifyApproversForRole(role, invoice) {
  const users = await User.find({ role, isActive: true }).select(
    "name email role"
  );
  for (const user of users) {
    const mail = invoiceApprovalEmail({
      approver: user,
      invoice,
      action: "request",
    });
    await sendMail(mail);
  }
}

async function createPaymentRequest(invoice, createdBy) {
  const existing = await Payment.findOne({ invoiceId: invoice._id });
  if (existing) return existing;

  const amount = getInvoiceAmount(invoice);
  if (!invoice.vendorId) return null;

  return Payment.create({
    invoiceId: invoice._id,
    vendorId: invoice.vendorId,
    amount,
    status: "pending",
    createdBy: createdBy?._id,
  });
}

export async function submitForApproval(invoice) {
  if (invoice.status !== "validated") {
    throw new Error("Invoice must be validated before submitting for approval");
  }
  if (invoice.validationErrors?.length > 0) {
    throw new Error("Resolve validation errors before submitting");
  }

  const amount = getInvoiceAmount(invoice);
  if (amount <= 0) {
    throw new Error("Invoice total is required to determine approval route");
  }

  const workflow = await getDefaultWorkflow();
  const rule = findRuleForAmount(workflow, amount);
  if (!rule?.approvers?.length) {
    throw new Error("No approval rule matches this invoice amount");
  }

  const now = new Date();
  invoice.approvalChain = rule.approvers.map((role, index) => ({
    role,
    status: "pending",
    activatedAt: index === 0 ? now : null,
    escalationAfterHours: rule.escalationAfterHours || 48,
  }));
  invoice.status = "pending_approval";
  invoice.markModified("approvalChain");

  await notifyApproversForRole(rule.approvers[0], invoice);

  return { workflow: workflow.name, rule, approvers: rule.approvers };
}

export async function processApproval(invoice, user, { action, remarks }) {
  if (invoice.status !== "pending_approval") {
    throw new Error("Invoice is not pending approval");
  }

  await applyEscalationIfNeeded(invoice);

  const step = getActivePendingStep(invoice);
  if (!step) {
    throw new Error("No pending approval step");
  }

  if (!canUserActOnStep(user, step)) {
    throw new Error("You are not authorized to act on this approval step");
  }

  if (!["approve", "reject"].includes(action)) {
    throw new Error("Action must be approve or reject");
  }

  step.userId = user._id;
  step.timestamp = new Date();
  step.remarks = remarks?.trim() || "";

  if (action === "reject") {
    step.status = "rejected";
    invoice.status = "rejected";
    invoice.markModified("approvalChain");
    return { status: "rejected" };
  }

  step.status = "approved";
  const next = getActivePendingStep(invoice);

  if (next) {
    next.activatedAt = new Date();
    invoice.markModified("approvalChain");
    await notifyApproversForRole(next.role, invoice);
    return { status: "pending_approval", nextRole: next.role };
  }

  invoice.status = "approved";
  invoice.markModified("approvalChain");
  await createPaymentRequest(invoice, user);

  return { status: "approved" };
}

export function serializeApprovalChain(chain) {
  return (chain || []).map((step) => {
    const s = step.toObject ? step.toObject() : step;
    const userRef = s.userId;
    const populated =
      userRef && typeof userRef === "object" && userRef.name != null;

    return {
      id: s._id?.toString(),
      role: s.role,
      status: s.status,
      remarks: s.remarks,
      timestamp: s.timestamp,
      activatedAt: s.activatedAt,
      escalationAfterHours: s.escalationAfterHours,
      userId: populated ? userRef._id?.toString() : userRef?.toString?.(),
      userName: populated ? userRef.name : undefined,
    };
  });
}
