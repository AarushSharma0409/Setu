-- Restore Postgres-side UUID defaults after Prisma normalized the handwritten initial migration.
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "AdminUser" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "RefreshSession" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "AuditLog" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
