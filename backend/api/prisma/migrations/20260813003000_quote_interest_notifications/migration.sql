CREATE TABLE "QuoteInterest" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "service" TEXT NOT NULL,
  "emailSentAt" TIMESTAMP(3),
  "emailDeliveryError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteInterest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteInterest_service_createdAt_idx" ON "QuoteInterest"("service", "createdAt");
CREATE INDEX "QuoteInterest_createdAt_idx" ON "QuoteInterest"("createdAt");
