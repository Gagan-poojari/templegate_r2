"use client";

import Link from "next/link";

export default function ExceptionsReport({ report }) {
  if (!report) return null;

  const { validation, matching, rejections, summary } = report;

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        {summary.total} exception items - {summary.validationCount} validation ·{" "}
        {summary.matchingCount} matching · {summary.rejectionCount} rejected
      </p>

      <Section title="Validation issues" count={validation.length}>
        {validation.map((item) => (
          <Item key={item.invoiceId} item={item} />
        ))}
      </Section>

      <Section title="PO / GRN matching" count={matching.length}>
        {matching.map((item) => (
          <div key={item.invoiceId} className="border-b border-slate-100 py-3 text-sm">
            <Link href={`/invoices/${item.invoiceId}`} className="font-medium hover:underline">
              {item.invoiceNumber || item.invoiceId}
            </Link>
            <span className="text-slate-500 ml-2 capitalize">
              {item.matchStatus} {item.matchType && `(${item.matchType})`}
            </span>
            {item.exceptions?.length > 0 && (
              <ul className="mt-1 text-red-700 list-disc pl-5">
                {item.exceptions.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </Section>

      <Section title="Rejected approvals" count={rejections.length}>
        {rejections.map((item) => (
          <div key={item.invoiceId} className="border-b border-slate-100 py-3 text-sm">
            <Link href={`/invoices/${item.invoiceId}`} className="font-medium hover:underline">
              {item.invoiceNumber || item.invoiceId}
            </Link>
            {item.remarks && (
              <p className="text-slate-600 mt-1 italic">{item.remarks}</p>
            )}
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, count, children }) {
  if (!count) {
    return (
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">None</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="font-semibold text-slate-900">
        {title} <span className="text-slate-500 font-normal">({count})</span>
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Item({ item }) {
  return (
    <div className="border-b border-slate-100 py-3 text-sm">
      <Link href={`/invoices/${item.invoiceId}`} className="font-medium hover:underline">
        {item.invoiceNumber || item.invoiceId}
      </Link>
      {item.errors?.length > 0 && (
        <ul className="mt-1 text-red-700 list-disc pl-5">
          {item.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {item.warnings?.length > 0 && (
        <ul className="mt-1 text-amber-700 list-disc pl-5">
          {item.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
