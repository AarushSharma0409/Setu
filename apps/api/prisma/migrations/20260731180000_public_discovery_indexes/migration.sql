-- CreateIndex
CREATE INDEX "VendorProfile_status_businessName_idx" ON "VendorProfile"("status", "businessName");

-- CreateIndex
CREATE INDEX "VendorProfile_status_primaryCityId_idx" ON "VendorProfile"("status", "primaryCityId");
