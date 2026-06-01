import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { serializeInvoice } from "@/lib/invoice-serialize";
import { processApproval } from "@/lib/approval";

export async function PUT(request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { action, remarks } = body;

    await connectDB();
    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const result = await processApproval(invoice, user, { action, remarks });
    await invoice.save();
    await invoice.populate("vendorId", "name vendorCode");

    return NextResponse.json({
      result,
      invoice: serializeInvoice(invoice),
    });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      { error: error.message || "Approval action failed" },
      { status: 400 }
    );
  }
}
