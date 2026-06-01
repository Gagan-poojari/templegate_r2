import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Invoice from "@/models/Invoice";
import { resolveUploadPath } from "@/lib/upload";
import { extractInvoiceData } from "@/lib/ocr";
import { serializeInvoice } from "@/lib/invoice-serialize";
import { applyInvoiceValidation } from "@/lib/invoice-validation";
import { formatOcrErrorForUser } from "@/lib/ocr-errors";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (!invoice.uploadedFile?.path) {
      return NextResponse.json({ error: "No file on invoice" }, { status: 400 });
    }

    const filePath = resolveUploadPath(invoice.uploadedFile.path);
    const ocr = await extractInvoiceData(
      filePath,
      invoice.uploadedFile.mimeType
    );

    invoice.invoiceNumber = ocr.invoiceNumber || invoice.invoiceNumber;
    invoice.poNumber = ocr.poNumber || invoice.poNumber;
    invoice.rawOcrText = ocr.tesseractRawText
      ? `--- AI (Gemini) ---\n${ocr.text || ""}\n\n--- Tesseract ---\n${ocr.tesseractRawText}`
      : ocr.text || "";
    invoice.ocrConfidence = ocr.confidence;
    invoice.ocrMethod = ocr.method;
    invoice.aiEnhanced = Boolean(ocr.aiEnhanced);
    invoice.requiresManualReview = Boolean(ocr.requiresManualReview);
    invoice.extractedData = {
      invoiceDate: ocr.extractedData.invoiceDate,
      dueDate: ocr.extractedData.dueDate,
      lineItems: ocr.extractedData.lineItems,
      subtotal: ocr.extractedData.subtotal,
      tax: ocr.extractedData.tax,
      total: ocr.extractedData.total,
      currency: ocr.extractedData.currency,
      gstin: ocr.extractedData.gstin,
      pan: ocr.extractedData.pan,
    };
    invoice.status = "uploaded";

    await applyInvoiceValidation(invoice, {
      markValidated: ocr.hasCoreFields && !ocr.requiresManualReview,
      updateStatus: true,
    });
    await invoice.save();
    await invoice.populate("vendorId", "name vendorCode");

    return NextResponse.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    console.error("Re-OCR error:", error);
    return NextResponse.json(
      { error: formatOcrErrorForUser(error) },
      { status: 400 }
    );
  }
}
