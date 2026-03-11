-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "review_comments" TEXT,
ADD COLUMN     "review_status" "ReviewStatus",
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_id" TEXT;

-- CreateIndex
CREATE INDEX "idx_projects_reviewed_by" ON "projects"("reviewed_by_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
