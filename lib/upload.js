import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const INVOICE_DIR = path.join(UPLOAD_ROOT, "invoices");

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/pdf",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export function validateInvoiceFile(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    return { ok: false, error: "No file provided" };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: "Unsupported file type. Use JPEG, PNG, WebP, TIFF, or PDF.",
    };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 10 MB or smaller" };
  }
  return { ok: true };
}

export async function saveInvoiceFile(file) {
  await fs.mkdir(INVOICE_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".bin";
  const storedName = `${randomUUID()}${ext}`;
  const absolutePath = path.join(INVOICE_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return {
    path: absolutePath,
    storedName,
    relativePath: path.posix.join("invoices", storedName),
    originalName: file.name,
    mimeType: file.type,
  };
}

export function resolveUploadPath(relativePath) {
  const normalized = relativePath.replace(/^\/+/, "");
  const full = path.join(UPLOAD_ROOT, normalized);
  if (!full.startsWith(UPLOAD_ROOT)) {
    throw new Error("Invalid file path");
  }
  return full;
}

export async function readUploadFile(relativePath) {
  const full = resolveUploadPath(relativePath);
  return fs.readFile(full);
}
