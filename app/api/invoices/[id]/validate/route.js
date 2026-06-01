import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { serializeInvoice } from "@/lib/invoice-serialize";
import { applyInvoiceValidation } from "@/lib/invoice-validation";

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    await connectDB();

    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const result = await applyInvoiceValidation(invoice, {
      markValidated: Boolean(body.markValidated),
      updateStatus: true,
    });

    await invoice.save();
    await invoice.populate("vendorId", "name vendorCode gstin");

    return NextResponse.json({
      validation: result,
      invoice: serializeInvoice(invoice),
    });
  } catch (error) {
    console.error("Validate invoice error:", error);
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  }
}
