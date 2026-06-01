import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { serializeInvoice } from "@/lib/invoice-serialize";
import { INVOICE_STATUSES } from "@/types";
import { applyInvoiceValidation } from "@/lib/invoice-validation";
import { applyPoMatch } from "@/lib/po-matching";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const invoice = await Invoice.findById(params.id)
      .populate("vendorId", "name vendorCode gstin")
      .populate("approvalChain.userId", "name email");

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    await connectDB();

    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (body.invoiceNumber !== undefined) {
      invoice.invoiceNumber = body.invoiceNumber?.trim() || "";
    }
    if (body.poNumber !== undefined) {
      invoice.poNumber = body.poNumber?.trim() || "";
    }
    if (body.grnNumber !== undefined) {
      invoice.grnNumber = body.grnNumber?.trim() || "";
    }
    const poFieldsChanged =
      body.poNumber !== undefined || body.grnNumber !== undefined;
    if (body.vendorId !== undefined) {
      invoice.vendorId = body.vendorId || null;
    }
    if (body.status && INVOICE_STATUSES.includes(body.status)) {
      invoice.status = body.status;
    }
    if (body.extractedData) {
      const current = invoice.extractedData?.toObject?.() || {};
      const next = { ...current, ...body.extractedData };
      if (body.extractedData.invoiceDate) {
        next.invoiceDate = new Date(body.extractedData.invoiceDate);
      }
      if (body.extractedData.dueDate) {
        next.dueDate = new Date(body.extractedData.dueDate);
      }
      invoice.extractedData = next;
      invoice.markModified("extractedData");
    }

    if (body.markValidated) {
      await applyInvoiceValidation(invoice, {
        markValidated: true,
        updateStatus: true,
      });
    } else if (
      body.invoiceNumber !== undefined ||
      body.extractedData ||
      body.vendorId !== undefined
    ) {
      await applyInvoiceValidation(invoice, { updateStatus: false });
    }

    if (
      poFieldsChanged &&
      !body.markValidated &&
      invoice.poNumber?.trim() &&
      invoice.status === "validated"
    ) {
      await applyPoMatch(invoice);
    }

    await invoice.save();
    await invoice.populate("vendorId", "name vendorCode gstin");

    return NextResponse.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const invoice = await Invoice.findByIdAndDelete(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
