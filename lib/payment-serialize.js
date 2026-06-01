export function serializePayment(doc) {
  const p = doc.toObject ? doc.toObject() : doc;

  const invoiceRef = p.invoiceId;
  const vendorRef = p.vendorId;
  const invoicePop =
    invoiceRef && typeof invoiceRef === "object" && invoiceRef.invoiceNumber != null;
  const vendorPop =
    vendorRef && typeof vendorRef === "object" && vendorRef.name != null;

  return {
    id: p._id?.toString(),
    invoiceId: invoicePop
      ? invoiceRef._id?.toString()
      : invoiceRef?.toString?.() || invoiceRef,
    invoice: invoicePop
      ? {
          id: invoiceRef._id?.toString(),
          invoiceNumber: invoiceRef.invoiceNumber,
          status: invoiceRef.status,
        }
      : undefined,
    vendorId: vendorPop
      ? vendorRef._id?.toString()
      : vendorRef?.toString?.() || vendorRef,
    vendor: vendorPop
      ? {
          id: vendorRef._id?.toString(),
          name: vendorRef.name,
          vendorCode: vendorRef.vendorCode,
        }
      : undefined,
    amount: p.amount,
    paymentDate: p.paymentDate,
    method: p.method,
    status: p.status,
    referenceNo: p.referenceNo,
    adviceSent: p.adviceSent,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
