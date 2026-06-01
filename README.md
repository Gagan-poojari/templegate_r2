# AP Automation

Accounts payable automation - Next.js 14, MongoDB, JWT auth.

## Setup

1. Copy environment file:

```bash
cp .env.example .env.local
```

2. Set `MONGODB_URI` and `JWT_SECRET` in `.env.local`.

3. Install dependencies and run:

```bash
cd ap-automation
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000). Register the first user (becomes **admin**).

5. Optional seed scripts:

```bash
node scripts/seed-default-workflow.js
node scripts/seed-approver-users.js
node scripts/seed-sample-po.js
```

Demo approvers: `l1@demo.local`, `l2@demo.local`, `cfo@demo.local` - password `Approver@123`

## Production build

```bash
npm run build
npm start
```

## Modules (complete)

| # | Module | Highlights |
|---|--------|------------|
| 1 | Setup + auth | Next.js 14, MongoDB, JWT cookies, middleware |
| 3 | Invoices + hybrid OCR | Tesseract + Gemini fallback, PDF support |
| 4 | Validation | GSTIN, PAN, duplicates, mandatory fields |
| 5 | PO matching | 2-way / 3-way |
| 6 | Approvals | L1/L2/CFO matrix, email, escalation |
| 7 | Vendors | CRUD, onboarding |
| 8 | Payments | Process, advice email, invoice → paid |
| 9 | Dashboard | KPIs, aging chart, vendor analytics |
| 10 | Reports | AP aging, GST, exceptions + CSV export |

## Key API routes

- `POST /api/auth/login` · `POST /api/invoices/upload`
- `GET /api/invoices` · `PUT /api/invoices/[id]/approve`
- `GET /api/vendors` · `GET /api/payments`
- `GET /api/dashboard/stats` · `GET /api/reports?type=all`

Files stored under `/uploads/invoices/`.
