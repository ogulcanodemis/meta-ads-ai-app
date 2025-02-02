/*
  Warnings:

  - You are about to drop the column `budget` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `metrics` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `placements` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `targetAudience` on the `Campaign` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,campaignId]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campaignId` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "budget",
DROP COLUMN "endDate",
DROP COLUMN "metrics",
DROP COLUMN "notes",
DROP COLUMN "placements",
DROP COLUMN "startDate",
DROP COLUMN "tags",
DROP COLUMN "targetAudience",
ADD COLUMN     "campaignId" TEXT NOT NULL,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "spendCap" DOUBLE PRECISION,
ADD COLUMN     "startTime" TIMESTAMP(3),
ALTER COLUMN "objective" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Campaign_userId_idx" ON "Campaign"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_userId_campaignId_key" ON "Campaign"("userId", "campaignId");
