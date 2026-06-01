import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { serializeInvoice } from "@/lib/invoice-serialize";
import { applyPoMatch } from "@/lib/po-matching";

export async function POST(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const match = await applyPoMatch(invoice);
    await invoice.save();
    await invoice.populate("vendorId", "name vendorCode");

    return NextResponse.json({
      match,
      invoice: serializeInvoice(invoice),
    });
  } catch (error) {
    console.error("PO match error:", error);
    return NextResponse.json({ error: "Matching failed" }, { status: 500 });
  }
}
