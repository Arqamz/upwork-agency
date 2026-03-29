-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStage" ADD VALUE 'SCRIPT_REVIEW';
ALTER TYPE "ProjectStage" ADD VALUE 'VIDEO_DRAFT';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "script_review_comments" TEXT,
ADD COLUMN     "script_review_status" "ReviewStatus",
ADD COLUMN     "script_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "script_reviewed_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_script_reviewed_by_id_fkey" FOREIGN KEY ("script_reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
