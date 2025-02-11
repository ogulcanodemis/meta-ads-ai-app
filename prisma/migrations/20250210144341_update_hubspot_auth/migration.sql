/*
  Warnings:

  - You are about to drop the column `accessToken` on the `HubspotAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HubspotAccount" DROP COLUMN "accessToken",
ADD COLUMN     "appId" TEXT,
ADD COLUMN     "clientSecret" TEXT;
