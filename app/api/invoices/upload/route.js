import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import { saveInvoiceFile, validateInvoiceFile } from "@/lib/upload";
import { extractInvoiceData } from "@/lib/ocr";
import Invoice from "@/models/Invoice";
import { serializeInvoice } from "@/lib/invoice-serialize";
import { applyInvoiceValidation } from "@/lib/invoice-validation";
import { formatOcrErrorForUser } from "@/lib/ocr-errors";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const vendorId = formData.get("vendorId")?.toString() || undefined;
    const poNumber = formData.get("poNumber")?.toString()?.trim() || undefined;

    const validation = validateInvoiceFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await connectDB();

    const saved = await saveInvoiceFile(file);

    let invoice = await Invoice.create({
      status: "ocr_processing",
      vendorId: vendorId || undefined,
      poNumber,
      uploadedFile: {
        path: saved.relativePath,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
      },
      createdBy: user._id,
    });

    try {
      const ocr = await extractInvoiceData(saved.path, saved.mimeType);

      const extractedPayload = {
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

      invoice.invoiceNumber = ocr.invoiceNumber || invoice.invoiceNumber;
      invoice.poNumber = ocr.poNumber || invoice.poNumber || poNumber;
      invoice.rawOcrText = ocr.tesseractRawText
        ? `--- AI (Gemini) ---\n${ocr.text || ""}\n\n--- Tesseract ---\n${ocr.tesseractRawText}`
        : ocr.text || "";
      invoice.ocrConfidence = ocr.confidence;
      invoice.ocrMethod = ocr.method;
      invoice.aiEnhanced = Boolean(ocr.aiEnhanced);
      invoice.requiresManualReview = Boolean(ocr.requiresManualReview);
      invoice.extractedData = extractedPayload;
      invoice.status = "uploaded";

      if (ocr.requiresManualReview) {
        invoice.validationWarnings = [
          ...(invoice.validationWarnings || []),
          "Low OCR confidence - please verify all fields before submitting.",
        ];
      }

      await applyInvoiceValidation(invoice, {
        markValidated: ocr.hasCoreFields && !ocr.requiresManualReview,
        updateStatus: true,
      });
      await invoice.save();
    } catch (ocrError) {
      console.error("OCR failed:", ocrError);
      invoice.status = "uploaded";
      invoice.validationErrors = [formatOcrErrorForUser(ocrError)];
      await invoice.save();
    }

    invoice = await Invoice.findById(invoice._id).populate(
      "vendorId",
      "name vendorCode"
    );

    return NextResponse.json(
      { invoice: serializeInvoice(invoice) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload invoice" },
      { status: 500 }
    );
  }
}
