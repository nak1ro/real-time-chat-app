/*
  Warnings:

  - A unique constraint covering the columns `[invitationId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "invitationId" TEXT;

-- CreateTable
CREATE TABLE "ConversationInvitation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ConversationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationInvitation_conversationId_idx" ON "ConversationInvitation"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationInvitation_recipientId_idx" ON "ConversationInvitation"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationInvitation_conversationId_recipientId_key" ON "ConversationInvitation"("conversationId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_invitationId_key" ON "Notification"("invitationId");

-- CreateIndex
CREATE INDEX "Notification_invitationId_idx" ON "Notification"("invitationId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ConversationInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationInvitation" ADD CONSTRAINT "ConversationInvitation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationInvitation" ADD CONSTRAINT "ConversationInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationInvitation" ADD CONSTRAINT "ConversationInvitation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
