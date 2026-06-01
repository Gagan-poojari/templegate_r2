import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isGeminiQuotaError } from "@/lib/ocr-errors";

const EXTRACTION_PROMPT = `You are an invoice data extraction system for Indian AP workflows.
Extract all fields from this invoice and return ONLY valid JSON, no markdown or explanation:
{
  "invoiceNumber": "",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "vendorName": "",
  "gstin": "",
  "pan": "",
  "poNumber": "",
  "lineItems": [
    { "description": "", "quantity": 0, "unitPrice": 0, "amount": 0 }
  ],
  "subtotal": 0,
  "taxAmount": 0,
  "total": 0,
  "currency": "INR",
  "confidence": 0.95
}
Use null for missing fields. quantity/unitPrice/amount as numbers. confidence is 0.0-1.0.`;

const DEFAULT_MODEL_FALLBACKS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
];

export function getGeminiMimeType(filePath, uploadMimeType) {
  if (uploadMimeType) return uploadMimeType;
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
  };
  return map[ext] || "image/jpeg";
}

function getModelList() {
  const preferred = process.env.GEMINI_MODEL?.trim();
  if (!preferred) return [...DEFAULT_MODEL_FALLBACKS];

  const rest = DEFAULT_MODEL_FALLBACKS.filter((m) => m !== preferred);
  return [preferred, ...rest];
}

function parseGeminiJson(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object in Gemini response");
  }
  return JSON.parse(clean.slice(start, end + 1));
}

export function mapGeminiToInvoiceFields(parsed) {
  const lineItems = (parsed.lineItems || []).map((item) => ({
    description: item.description || "",
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice ?? item.rate) || 0,
    amount: Number(item.amount) || 0,
  }));

  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const extractedData = {
    invoiceDate: parseDate(parsed.invoiceDate),
    dueDate: parseDate(parsed.dueDate),
    lineItems,
    subtotal: parsed.subtotal != null ? Number(parsed.subtotal) : null,
    tax: parsed.taxAmount != null ? Number(parsed.taxAmount) : null,
    total: parsed.total != null ? Number(parsed.total) : null,
    currency: parsed.currency || "INR",
    gstin: parsed.gstin?.toUpperCase?.() || parsed.gstin || null,
    pan: parsed.pan?.toUpperCase?.() || parsed.pan || null,
  };

  const hasCoreFields = Boolean(
    parsed.invoiceNumber ||
      extractedData.total != null ||
      extractedData.gstin
  );

  const confidence =
    parsed.confidence != null
      ? Math.round(
          parsed.confidence <= 1 ? parsed.confidence * 100 : parsed.confidence
        )
      : 92;

  return {
    invoiceNumber: parsed.invoiceNumber?.trim() || null,
    poNumber: parsed.poNumber?.trim() || null,
    extractedData,
    hasCoreFields,
    confidence: Math.min(100, Math.max(0, confidence)),
    vendorName: parsed.vendorName || null,
  };
}

async function generateWithModel(genAI, modelName, base64Data, mimeType) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    },
    { text: EXTRACTION_PROMPT },
  ]);
  return result.response.text();
}

export async function runGeminiOCR(filePath, uploadMimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. PDF and low-confidence scans require Gemini (free at aistudio.google.com)."
    );
  }

  const mimeType = getGeminiMimeType(filePath, uploadMimeType);
  const buffer = fs.readFileSync(filePath);
  const base64Data = buffer.toString("base64");
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = getModelList();

  let lastError = null;
  const quotaModels = [];

  for (const modelName of models) {
    try {
      console.log(`[ocr-gemini] Trying model: ${modelName}`);
      const text = await generateWithModel(genAI, modelName, base64Data, mimeType);
      const parsed = parseGeminiJson(text);
      const mapped = mapGeminiToInvoiceFields(parsed);

      return {
        ...mapped,
        text,
        method: "gemini",
        aiEnhanced: true,
        geminiModel: modelName,
        rawGemini: parsed,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[ocr-gemini] ${modelName} failed:`, err.message?.slice(0, 120));

      if (isGeminiQuotaError(err)) {
        quotaModels.push(modelName);
        continue;
      }

      throw err;
    }
  }

  if (quotaModels.length === models.length) {
    const e = new Error(
      "GEMINI_QUOTA_EXCEEDED: All configured Gemini models hit free-tier rate limits. Wait about 1 minute and retry, or use PDF text fallback."
    );
    e.cause = lastError;
    throw e;
  }

  throw lastError || new Error("Gemini OCR failed");
}
