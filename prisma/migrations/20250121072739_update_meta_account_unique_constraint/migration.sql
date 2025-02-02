/*
  Warnings:

  - A unique constraint covering the columns `[userId,accountId]` on the table `MetaAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MetaAccount_accountId_key";

-- CreateIndex
CREATE INDEX "MetaAccount_userId_idx" ON "MetaAccount"("userId");

-- CreateIndex
CREATE INDEX "MetaAccount_accountId_idx" ON "MetaAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaAccount_userId_accountId_key" ON "MetaAccount"("userId", "accountId");
