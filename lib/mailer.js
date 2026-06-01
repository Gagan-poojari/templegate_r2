import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter !== null) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = false;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || "noreply@example.com";

  if (!transport) {
    console.log("[mailer] SMTP not configured - would send:", { to, subject });
    return { skipped: true };
  }

  return transport.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ""),
  });
}

export function invoiceApprovalEmail({ approver, invoice, action }) {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const amount = invoice.extractedData?.total ?? 0;
  const link = `${baseUrl}/invoices/${invoice._id}`;

  const subject =
    action === "escalation"
      ? `[Escalated] Invoice ${invoice.invoiceNumber || invoice._id} needs attention`
      : `[AP Approval] Invoice ${invoice.invoiceNumber || "pending"} - ${approver.role}`;

  const html = `
    <p>Hi ${approver.name},</p>
    <p>${
      action === "escalation"
        ? "An approval step has been escalated due to no action within the SLA window."
        : "An invoice is awaiting your approval."
    }</p>
    <ul>
      <li><strong>Invoice #:</strong> ${invoice.invoiceNumber || "-"}</li>
      <li><strong>Amount:</strong> ₹${Number(amount).toLocaleString("en-IN")}</li>
      <li><strong>PO:</strong> ${invoice.poNumber || "-"}</li>
      <li><strong>Your role:</strong> ${approver.role}</li>
    </ul>
    <p><a href="${link}">Review invoice</a></p>
  `;

  return { to: approver.email, subject, html };
}
