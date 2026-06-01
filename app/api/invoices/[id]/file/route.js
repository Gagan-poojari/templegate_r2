import { NextResponse } from "next/server";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { readUploadFile } from "@/lib/upload";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const invoice = await Invoice.findById(params.id).select("uploadedFile");

    if (!invoice?.uploadedFile?.path) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = await readUploadFile(invoice.uploadedFile.path);
    const mimeType =
      invoice.uploadedFile.mimeType || "application/octet-stream";
    const filename = invoice.uploadedFile.originalName || "invoice";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${path.basename(filename)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Serve file error:", error);
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
  }
}
