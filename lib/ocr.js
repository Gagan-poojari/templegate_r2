import path from "path";
import { createWorker } from "tesseract.js";
import { parseInvoiceText } from "@/lib/invoice-parser";
import { runGeminiOCR, getGeminiMimeType } from "@/lib/ocr-gemini";
import { extractTextFromPdf } from "@/lib/pdf-text";
import { isGeminiQuotaError } from "@/lib/ocr-errors";

let workerPromise = null;

function getConfidenceThreshold() {
  const raw = process.env.OCR_CONFIDENCE_THRESHOLD || "85";
  return parseInt(raw, 10) || 85;
}

function isPdf(filePath, mimeType) {
  return (
    mimeType === "application/pdf" ||
    path.extname(filePath).toLowerCase() === ".pdf"
  );
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("eng");
      return worker;
    })();
  }
  return workerPromise;
}

async function runTesseract(filePath) {
  const worker = await getWorker();
  const { data } = await worker.recognize(filePath);
  return {
    rawText: data.text || "",
    confidence: Math.round(data.confidence || 0),
    method: "tesseract",
  };
}

function buildFromParsedText(rawText, options = {}) {
  const parsed = parseInvoiceText(rawText);
  const confidence =
    options.confidence ??
    (parsed.hasCoreFields ? 78 : Math.min(70, 50 + rawText.length / 100));

  return {
    text: rawText,
    confidence,
    ...parsed,
    method: options.method || "pdf_text",
    aiEnhanced: false,
    requiresManualReview: options.requiresManualReview ?? !parsed.hasCoreFields,
    tesseractRawText: options.tesseractRawText,
  };
}

function buildFromTesseract(tesseractResult, options = {}) {
  return buildFromParsedText(tesseractResult.rawText, {
    confidence: tesseractResult.confidence,
    method: options.method || "tesseract",
    requiresManualReview: options.requiresManualReview || false,
    tesseractRawText: tesseractResult.rawText,
  });
}

function mapGeminiResult(gemini, tesseractRawText) {
  return {
    text: gemini.text,
    confidence: gemini.confidence,
    invoiceNumber: gemini.invoiceNumber,
    poNumber: gemini.poNumber,
    extractedData: gemini.extractedData,
    hasCoreFields: gemini.hasCoreFields,
    method: "gemini",
    aiEnhanced: true,
    requiresManualReview: !gemini.hasCoreFields,
    tesseractRawText: tesseractRawText || undefined,
    vendorName: gemini.vendorName,
  };
}

async function tryPdfTextFallback(filePath, reason) {
  console.log(`[ocr] ${reason} — trying PDF text extraction`);
  try {
    const rawText = await extractTextFromPdf(filePath);
    if (rawText.length > 30) {
      return buildFromParsedText(rawText, {
        method: "pdf_text",
        confidence: 80,
        requiresManualReview: false,
      });
    }
  } catch (pdfErr) {
    console.error("[ocr] PDF text extraction failed:", pdfErr.message);
  }
  return null;
}

async function tryGeminiThenPdfFallback(filePath, mimeType) {
  try {
    const gemini = await runGeminiOCR(filePath, mimeType);
    return mapGeminiResult(gemini);
  } catch (err) {
    const quota =
      isGeminiQuotaError(err) ||
      String(err.message || "").includes("GEMINI_QUOTA_EXCEEDED");

    if (quota && isPdf(filePath, mimeType)) {
      const pdfFallback = await tryPdfTextFallback(
        filePath,
        "Gemini quota exceeded"
      );
      if (pdfFallback) return pdfFallback;
    }

    throw err;
  }
}

/**
 * Smart OCR: Tesseract on images; PDFs → Gemini, then PDF text if quota exceeded.
 */
export async function extractInvoiceData(filePath, uploadMimeType) {
  const mimeType = getGeminiMimeType(filePath, uploadMimeType);
  const threshold = getConfidenceThreshold();

  if (isPdf(filePath, mimeType)) {
    console.log("[ocr] PDF detected — Gemini Vision (with PDF text fallback)");
    return tryGeminiThenPdfFallback(filePath, mimeType);
  }

  let tesseractResult = { confidence: 0, rawText: "" };
  try {
    tesseractResult = await runTesseract(filePath);
    console.log(`[ocr] Tesseract confidence: ${tesseractResult.confidence}%`);
  } catch (err) {
    console.error("[ocr] Tesseract failed:", err.message);
  }

  if (tesseractResult.confidence >= threshold && tesseractResult.rawText.trim()) {
    return buildFromTesseract(tesseractResult);
  }

  console.log(
    `[ocr] Below threshold (${tesseractResult.confidence}% < ${threshold}%) — trying Gemini`
  );

  try {
    const gemini = await runGeminiOCR(filePath, mimeType);
    return mapGeminiResult(gemini, tesseractResult.rawText);
  } catch (err) {
    console.error("[ocr] Gemini fallback failed:", err.message);

    if (tesseractResult.rawText.trim()) {
      return buildFromTesseract(tesseractResult, {
        method: "tesseract_fallback",
        requiresManualReview: true,
      });
    }

    if (isGeminiQuotaError(err)) {
      throw new Error(
        "GEMINI_QUOTA_EXCEEDED: Rate limit hit. Wait ~1 minute and click Re-run OCR, or enter details manually."
      );
    }

    throw err;
  }
}

export async function runOcrOnFile(filePath, uploadMimeType) {
  return extractInvoiceData(filePath, uploadMimeType);
}

export async function shutdownOcrWorker() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
