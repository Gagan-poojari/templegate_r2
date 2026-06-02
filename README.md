# Templegate AP Automation

Full-stack accounts payable automation for Indian AP workflows: invoice capture (hybrid OCR), validation, PO matching, approvals, vendor onboarding, payments, and reporting.

**Stack:** Next.js 14 (App Router) · MongoDB · Mongoose · JWT (HTTP-only cookies) · Tailwind CSS · Tesseract.js + Google Gemini Vision

For architecture, data models, and API reference, see [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md).

---

## Quick start

### 1. Environment

```bash
cd ap-automation
cp .env.local
```

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | Yes | Local MongoDB or Atlas |
| `JWT_SECRET` | Yes | Long random string |
| `GEMINI_API_KEY` | For PDFs / low-confidence OCR | Free key from [Google AI Studio](https://aistudio.google.com) |
| `SMTP_*` | No | Approval emails log to console if unset |

### 2. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **Register** the first user — they become **admin** automatically.

### 3. Optional demo data

```bash
node scripts/seed-default-workflow.js   # L1 / L2 / CFO approval matrix
node scripts/seed-approver-users.js     # l1@, l2@, cfo@ demo.local
node scripts/seed-sample-po.js            # DEMO-001 vendor, PO-2024-1001, GRN-2024-5001
```

Demo approvers: `l1@demo.local`, `l2@demo.local`, `cfo@demo.local` — password `Approver@123`

Sample PDFs for testing live in `sample-invoices/` (e.g. `invoice_valid_50k.pdf` pairs with seeded PO `PO-2024-1001` at ₹50,000).

---

## Production

```bash
npm run build
npm start
```

Use HTTPS in production so secure cookies work. Store uploads on durable disk or swap `lib/upload.js` for S3/blob storage.

---

## Application features

| Area | What you can do |
|------|-----------------|
| **Invoices** | Upload JPEG/PNG/WebP/TIFF/PDF; hybrid OCR; edit fields; validate; 2-way/3-way PO match; submit/approve; delete (admin / ap_clerk) |
| **Vendors** | CRUD, GSTIN/PAN validation, onboarding workflow |
| **Purchase orders** | Create POs manually on the vendor detail page (line items + total); used for invoice matching |
| **Approvals** | Amount-based L1 → L2 → CFO chain; queue; email notifications |
| **Payments** | Pending → processed/failed; marks invoice paid |
| **Dashboard** | KPIs, aging chart, status breakdown, vendor spend |
| **Reports** | AP aging, GST summary, exceptions; CSV export |

### Hybrid OCR pipeline

1. **PDF** → Gemini Vision (Tesseract cannot read PDF binaries).
2. **Image** → Tesseract first; if confidence &lt; `OCR_CONFIDENCE_THRESHOLD` (default 85%), Gemini fallback.
3. UI badges: **Standard OCR**, **AI-enhanced**, **Manual review**.

Set `GEMINI_API_KEY` in `.env.local` before uploading PDFs.

### GSTIN validation

Uses the official GSTN mod-36 checksum (right-to-left). Vendor save **blocks** invalid checksums; invoice OCR treats checksum mismatch as a **warning** (OCR often misreads one character).

Example: Infosys Karnataka → `29AABCI1681G1ZK` (not `…1ZA`).

### UI shell

- Desktop: fixed full-height sidebar; main content scrolls independently.
- Mobile: slide-in drawer with hamburger menu.

---

## Key routes (UI)

| Path | Purpose |
|------|---------|
| `/dashboard` | Overview |
| `/invoices`, `/invoices/upload`, `/invoices/[id]` | List, upload, detail |
| `/vendors`, `/vendors/new`, `/vendors/[id]` | Vendors + **create POs** |
| `/approvals` | Approval queue |
| `/payments`, `/payments/[id]` | Payments |
| `/reports` | Reports |

## Key API routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login`, `/register`, `/logout` | Auth |
| POST | `/api/invoices/upload` | Upload + OCR |
| GET/PUT/DELETE | `/api/invoices/[id]` | Detail, update, delete |
| POST | `/api/invoices/[id]/match` | Run PO matching |
| POST | `/api/invoices/[id]/validate` | Re-run validation |
| GET/POST | `/api/purchase-orders` | List (`?vendorId=`) / create PO |
| GET/POST | `/api/vendors`, `/api/vendors/[id]` | Vendors |
| GET | `/api/approvals` | Approval queue |
| GET/PUT | `/api/payments/[id]` | Payments |
| GET | `/api/dashboard/stats` | Dashboard |
| GET | `/api/reports?type=all` | Reports |

Uploaded files are stored under `uploads/invoices/` (gitignored).

---

## Roles

| Role | Typical use |
|------|-------------|
| `admin` | Full access |
| `ap_clerk` | Upload/edit invoices, delete invoices, vendors |
| `approver_l1` / `approver_l2` / `cfo` | Approve by tier |
| `vendor_manager` | Vendor onboarding verify/reject |

---

## Module checklist

| # | Module | Status |
|---|--------|--------|
| 1 | Setup, auth, middleware, models | Done |
| 3 | Invoices + hybrid OCR | Done |
| 4 | Validation (GSTIN, PAN, amounts) | Done |
| 5 | PO matching (2-way / 3-way) | Done |
| 6 | Approvals + email | Done |
| 7 | Vendors + onboarding + **manual POs** | Done |
| 8 | Payments | Done |
| 9 | Dashboard + charts | Done |
| 10 | Reports + CSV | Done |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| PO matching: “Purchase order not found” | Create a PO on the vendor page, or run `node scripts/seed-sample-po.js`, then **Run Matching** on the invoice |
| PDF upload fails / no extraction | Add `GEMINI_API_KEY` to `.env.local` |
| GSTIN checksum error on vendor | Use the correct 15th character; see validation message (`expected "K", got "A"`) |
| Approval emails not sent | Configure `SMTP_*` in `.env.local`; otherwise check server console logs |

---

*Templegate AP Automation — `ap-automation/`*
