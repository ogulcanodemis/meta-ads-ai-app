-- CreateTable
CREATE TABLE "HubspotAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "privateKey" TEXT,
    "authType" TEXT NOT NULL DEFAULT 'oauth',
    "status" TEXT NOT NULL DEFAULT 'active',
    "permissions" TEXT[],
    "userId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubspotAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubspotContact" (
    "id" TEXT NOT NULL,
    "hubspotId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "lifecycle_stage" TEXT,
    "properties" JSONB,
    "hubspotAccountId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubspotContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubspotDeal" (
    "id" TEXT NOT NULL,
    "hubspotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "closeDate" TIMESTAMP(3),
    "pipeline" TEXT,
    "properties" JSONB,
    "hubspotAccountId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HubspotDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HubspotContactToHubspotDeal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HubspotContactToHubspotDeal_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "HubspotAccount_userId_idx" ON "HubspotAccount"("userId");

-- CreateIndex
CREATE INDEX "HubspotAccount_accountId_idx" ON "HubspotAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "HubspotAccount_userId_accountId_key" ON "HubspotAccount"("userId", "accountId");

-- CreateIndex
CREATE INDEX "HubspotContact_email_idx" ON "HubspotContact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HubspotContact_hubspotAccountId_hubspotId_key" ON "HubspotContact"("hubspotAccountId", "hubspotId");

-- CreateIndex
CREATE INDEX "HubspotDeal_stage_idx" ON "HubspotDeal"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "HubspotDeal_hubspotAccountId_hubspotId_key" ON "HubspotDeal"("hubspotAccountId", "hubspotId");

-- CreateIndex
CREATE INDEX "_HubspotContactToHubspotDeal_B_index" ON "_HubspotContactToHubspotDeal"("B");

-- AddForeignKey
ALTER TABLE "HubspotAccount" ADD CONSTRAINT "HubspotAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubspotContact" ADD CONSTRAINT "HubspotContact_hubspotAccountId_fkey" FOREIGN KEY ("hubspotAccountId") REFERENCES "HubspotAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubspotDeal" ADD CONSTRAINT "HubspotDeal_hubspotAccountId_fkey" FOREIGN KEY ("hubspotAccountId") REFERENCES "HubspotAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HubspotContactToHubspotDeal" ADD CONSTRAINT "_HubspotContactToHubspotDeal_A_fkey" FOREIGN KEY ("A") REFERENCES "HubspotContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HubspotContactToHubspotDeal" ADD CONSTRAINT "_HubspotContactToHubspotDeal_B_fkey" FOREIGN KEY ("B") REFERENCES "HubspotDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
