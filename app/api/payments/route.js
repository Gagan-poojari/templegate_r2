import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Payment from "@/models/Payment";
import Invoice from "@/models/Invoice";
import { serializePayment } from "@/lib/payment-serialize";
import { PAYMENT_STATUSES } from "@/types";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );

    const filter = {};
    if (status) filter.status = status;
    if (vendorId) filter.vendorId = vendorId;

    await connectDB();

    const [items, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("invoiceId", "invoiceNumber status")
        .populate("vendorId", "name vendorCode")
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return NextResponse.json({
      payments: items.map(serializePayment),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("List payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { invoiceId, method } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.status !== "approved" && invoice.status !== "paid") {
      return NextResponse.json(
        { error: "Invoice must be approved before creating a payment" },
        { status: 400 }
      );
    }
    if (!invoice.vendorId) {
      return NextResponse.json(
        { error: "Invoice has no linked vendor" },
        { status: 400 }
      );
    }

    const existing = await Payment.findOne({ invoiceId });
    if (existing) {
      return NextResponse.json(
        { error: "Payment already exists for this invoice", payment: serializePayment(existing) },
        { status: 409 }
      );
    }

    const amount =
      body.amount ?? invoice.extractedData?.total ?? 0;

    const payment = await Payment.create({
      invoiceId: invoice._id,
      vendorId: invoice.vendorId,
      amount,
      method: method || "bank_transfer",
      status: "pending",
      createdBy: user._id,
    });

    await payment.populate("invoiceId", "invoiceNumber status");
    await payment.populate("vendorId", "name vendorCode");

    return NextResponse.json(
      { payment: serializePayment(payment) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
