ALTER TABLE "AdminUser" ADD COLUMN "googleSubject" TEXT;

CREATE UNIQUE INDEX "AdminUser_googleSubject_key" ON "AdminUser"("googleSubject");
