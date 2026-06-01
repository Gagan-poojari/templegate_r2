import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { serializeInvoice } from "@/lib/invoice-serialize";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const status = searchParams.get("status");
    const search = searchParams.get("q")?.trim();

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { poNumber: { $regex: search, $options: "i" } },
      ];
    }

    await connectDB();

    const [items, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("vendorId", "name vendorCode")
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    return NextResponse.json({
      invoices: items.map((doc) => serializeInvoice(doc)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("List invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
