import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Payment from "@/models/Payment";
import Invoice from "@/models/Invoice";
import { serializePayment } from "@/lib/payment-serialize";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const payment = await Payment.findOne({ invoiceId: params.id })
      .populate("invoiceId", "invoiceNumber status")
      .populate("vendorId", "name vendorCode");

    if (!payment) {
      return NextResponse.json({ payment: null });
    }

    return NextResponse.json({ payment: serializePayment(payment) });
  } catch (error) {
    console.error("Get invoice payment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}
