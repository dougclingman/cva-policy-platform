-- CreateEnum
CREATE TYPE "ReviewFrequency" AS ENUM ('NONE', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL');

-- AlterTable: add review scheduling and acknowledgment fields to policies
ALTER TABLE "policies"
  ADD COLUMN "reviewFrequency"    "ReviewFrequency" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "nextReviewDate"     TIMESTAMP(3),
  ADD COLUMN "lastReviewedAt"     TIMESTAMP(3),
  ADD COLUMN "reviewReminderDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "acknowledgmentRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "acknowledgmentDeadline" TIMESTAMP(3);

-- CreateTable: policy acknowledgments
CREATE TABLE "policy_acknowledgments" (
    "id"             TEXT NOT NULL,
    "policyId"       TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "policy_acknowledgments_policyId_userId_key" ON "policy_acknowledgments"("policyId", "userId");

-- AddForeignKey
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_policyId_fkey"
  FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
