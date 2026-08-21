INSERT INTO "Category" ("id", "name", "slug", "description", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Insurance Services', 'insurance-services', 'Connect with independent insurance advisors and licensed insurance service providers.', true, 60, NOW(), NOW()),
  (gen_random_uuid(), 'Financial Services', 'financial-services', 'Discover mutual fund professionals, investment brokers, and fixed-income specialists.', true, 70, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "isActive" = true, "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = NOW();
