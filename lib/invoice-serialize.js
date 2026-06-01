import { serializeApprovalChain } from "@/lib/approval";

export function serializeInvoice(doc) {
  const inv = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const vendorRef = inv.vendorId;
  const vendorPopulated =
    vendorRef &&
    typeof vendorRef === "object" &&
    vendorRef.name != null;

  return {
    id: inv._id?.toString(),
    invoiceNumber: inv.invoiceNumber,
    vendorId: vendorPopulated
      ? vendorRef._id?.toString()
      : vendorRef?.toString?.() || vendorRef,
    vendor: vendorPopulated
      ? {
          id: vendorRef._id?.toString(),
          name: vendorRef.name,
          vendorCode: vendorRef.vendorCode,
        }
      : undefined,
    poNumber: inv.poNumber,
    grnNumber: inv.grnNumber,
    status: inv.status,
    extractedData: inv.extractedData,
    ocrConfidence: inv.ocrConfidence,
    ocrMethod: inv.ocrMethod,
    aiEnhanced: inv.aiEnhanced,
    requiresManualReview: inv.requiresManualReview,
    matchType: inv.matchType,
    matchStatus: inv.matchStatus,
    matchDetails: inv.matchDetails,
    approvalChain: serializeApprovalChain(inv.approvalChain),
    uploadedFile: inv.uploadedFile,
    rawOcrText: inv.rawOcrText,
    validationErrors: inv.validationErrors,
    validationWarnings: inv.validationWarnings,
    createdBy: inv.createdBy?.toString?.() || inv.createdBy,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
}
