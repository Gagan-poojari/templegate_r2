export function serializeVendor(doc) {
  const v = doc.toObject ? doc.toObject() : doc;
  return {
    id: v._id?.toString(),
    vendorCode: v.vendorCode,
    name: v.name,
    email: v.email,
    phone: v.phone,
    gstin: v.gstin,
    pan: v.pan,
    tin: v.tin,
    bankDetails: v.bankDetails,
    status: v.status,
    onboardingStatus: v.onboardingStatus,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}
