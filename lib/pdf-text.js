import fs from "fs";
import { PDFParse } from "pdf-parse";

/**
 * Extract embedded text from digital PDFs (no AI). Works when Gemini quota is exceeded.
 */
export async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy?.();
  }
}
