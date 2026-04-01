-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'FINALISED';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "suggested_bid_amount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "is_urgent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "upwork_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "profile_url" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upwork_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_upwork_accounts_user" ON "upwork_accounts"("user_id");

-- AddForeignKey
ALTER TABLE "upwork_accounts" ADD CONSTRAINT "upwork_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
