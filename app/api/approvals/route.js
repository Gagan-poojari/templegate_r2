import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { serializeInvoice } from "@/lib/invoice-serialize";
import {
  applyEscalationIfNeeded,
  canUserActOnStep,
  getActivePendingStep,
  serializeApprovalChain,
} from "@/lib/approval";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();

    const pending = await Invoice.find({ status: "pending_approval" })
      .sort({ updatedAt: -1 })
      .populate("vendorId", "name vendorCode")
      .populate("approvalChain.userId", "name email");

    const queue = [];

    for (const invoice of pending) {
      const escalated = await applyEscalationIfNeeded(invoice);
      if (escalated) await invoice.save();

      const step = getActivePendingStep(invoice);
      const canAct = canUserActOnStep(user, step);

      if (canAct || user.role === "admin") {
        queue.push({
          ...serializeInvoice(invoice),
          approvalChain: serializeApprovalChain(invoice.approvalChain),
          currentStep: step
            ? {
                role: step.role,
                status: step.status,
                activatedAt: step.activatedAt,
              }
            : null,
          canAct,
        });
      }
    }

    return NextResponse.json({
      approvals: queue.filter((item) => item.canAct),
      allPending: queue.length,
    });
  } catch (error) {
    console.error("Approvals queue error:", error);
    return NextResponse.json(
      { error: "Failed to load approval queue" },
      { status: 500 }
    );
  }
}
