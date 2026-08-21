-- Finance is one marketplace category. Insurance appears as a product area within it.
-- Preserve existing vendor choices while consolidating the legacy categories.
UPDATE "Category"
SET
  "name" = 'Finance',
  "slug" = 'finance',
  "description" = 'Discover finance and insurance professionals, investment brokers, and fixed-income specialists.',
  "sortOrder" = 60,
  "updatedAt" = NOW()
WHERE "slug" = 'financial-services';

INSERT INTO "VendorCategory" ("vendorId", "categoryId", "createdAt")
SELECT legacy."vendorId", finance."id", legacy."createdAt"
FROM "VendorCategory" legacy
JOIN "Category" insurance ON insurance."id" = legacy."categoryId" AND insurance."slug" = 'insurance-services'
JOIN "Category" finance ON finance."slug" = 'finance'
ON CONFLICT ("vendorId", "categoryId") DO NOTHING;

UPDATE "Inquiry"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'finance')
WHERE "categoryId" IN (
  SELECT "id" FROM "Category" WHERE "slug" = 'insurance-services'
);

DELETE FROM "VendorCategory"
WHERE "categoryId" IN (
  SELECT "id" FROM "Category" WHERE "slug" = 'insurance-services'
);

DELETE FROM "Category" WHERE "slug" = 'insurance-services';
