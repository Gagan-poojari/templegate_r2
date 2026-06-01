import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Payment from "@/models/Payment";
import Invoice from "@/models/Invoice";
import Vendor from "@/models/Vendor";
import { serializePayment } from "@/lib/payment-serialize";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/types";
import { sendMail } from "@/lib/mailer";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const payment = await Payment.findById(params.id)
      .populate("invoiceId", "invoiceNumber status poNumber")
      .populate("vendorId", "name vendorCode email gstin bankDetails");

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ payment: serializePayment(payment) });
  } catch (error) {
    console.error("Get payment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
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

    const payment = await Payment.findById(params.id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (body.method && PAYMENT_METHODS.includes(body.method)) {
      payment.method = body.method;
    }
    if (body.referenceNo !== undefined) {
      payment.referenceNo = body.referenceNo?.trim() || "";
    }
    if (body.paymentDate) {
      payment.paymentDate = new Date(body.paymentDate);
    }
    if (body.status && PAYMENT_STATUSES.includes(body.status)) {
      payment.status = body.status;

      if (body.status === "processed") {
        payment.paymentDate = payment.paymentDate || new Date();
        const invoice = await Invoice.findById(payment.invoiceId);
        if (invoice) {
          invoice.status = "paid";
          await invoice.save();
        }
      }

      if (body.status === "failed") {
        const invoice = await Invoice.findById(payment.invoiceId);
        if (invoice && invoice.status === "paid") {
          invoice.status = "approved";
          await invoice.save();
        }
      }
    }

    if (body.sendAdvice === true && !payment.adviceSent) {
      const vendor = await Vendor.findById(payment.vendorId).select(
        "name email bankDetails"
      );
      if (vendor?.email) {
        await sendMail({
          to: vendor.email,
          subject: `Payment advice - ${payment.referenceNo || payment._id}`,
          html: `
            <p>Dear ${vendor.name},</p>
            <p>Payment of <strong>₹${Number(payment.amount).toLocaleString("en-IN")}</strong> has been processed.</p>
            <p>Reference: ${payment.referenceNo || "-"}</p>
            <p>Method: ${payment.method}</p>
          `,
        });
        payment.adviceSent = true;
      }
    }

    if (body.adviceSent === true) {
      payment.adviceSent = true;
    }

    await payment.save();
    await payment.populate("invoiceId", "invoiceNumber status");
    await payment.populate("vendorId", "name vendorCode");

    return NextResponse.json({ payment: serializePayment(payment) });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
