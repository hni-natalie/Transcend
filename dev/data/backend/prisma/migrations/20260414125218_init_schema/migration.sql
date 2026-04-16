CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('offline', 'online', 'busy', 'in_meeting');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('shared', 'department');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('absent', 'present');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('not_started', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "MeetingRole" AS ENUM ('organiser', 'participant');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('faq', 'meeting_summary');

-- CreateTable
CREATE TABLE "Role" (
    "roleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "Department" (
    "dpId" TEXT NOT NULL,
    "dpName" TEXT NOT NULL,
    "dpLead" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("dpId")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPassword" TEXT,
    "userName" TEXT NOT NULL,
    "userStatus" "UserStatus" NOT NULL DEFAULT 'offline',
    "roleId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "dpId" TEXT,
    "avatarUrl" TEXT,
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "authProvider" TEXT DEFAULT 'email',
    "googleId" TEXT,
    "emailVerified" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "workspaceId" TEXT NOT NULL,
    "workspaceName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("workspaceId")
);

-- CreateTable
CREATE TABLE "Space" (
    "spaceId" TEXT NOT NULL,
    "spaceName" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'shared',
    "departmentId" TEXT,
    "keyPersonId" TEXT,
    "isPublicBook" BOOLEAN DEFAULT true,
    "userCapacity" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("spaceId")
);

-- CreateTable
CREATE TABLE "Task" (
    "taskId" TEXT NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "taskDesc" TEXT,
    "taskStatus" "TaskStatus" NOT NULL DEFAULT 'not_started',
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "workspaceId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("taskId")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "assignedId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskPriority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("assignedId")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "meetId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "meetTitle" TEXT NOT NULL,
    "meetDesc" TEXT,
    "meetStart" TIMESTAMP(3) NOT NULL,
    "meetEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("meetId")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MeetingRole" NOT NULL,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileURL" TEXT,
    "content" TEXT,
    "type" "DocumentType" NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "chunkIndex" INTEGER NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "Department_dpName_key" ON "Department"("dpName");

-- CreateIndex
CREATE UNIQUE INDEX "Department_dpLead_key" ON "Department"("dpLead");

-- CreateIndex
CREATE UNIQUE INDEX "User_userEmail_key" ON "User"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Space_keyPersonId_key" ON "Space"("keyPersonId");

-- CreateIndex
CREATE INDEX "Task_workspaceId_taskStatus_idx" ON "Task"("workspaceId", "taskStatus");

-- CreateIndex
CREATE INDEX "Task_workspaceId_createdByUserId_idx" ON "Task"("workspaceId", "createdByUserId");

-- CreateIndex
CREATE INDEX "Task_createdByUserId_idx" ON "Task"("createdByUserId");

-- CreateIndex
CREATE INDEX "Task_deletedAt_idx" ON "Task"("deletedAt");

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_idx" ON "TaskAssignment"("userId");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskId_idx" ON "TaskAssignment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskPriority_idx" ON "TaskAssignment"("taskPriority");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");

-- CreateIndex
CREATE INDEX "Meeting_workspaceId_idx" ON "Meeting"("workspaceId");

-- CreateIndex
CREATE INDEX "Meeting_spaceId_idx" ON "Meeting"("spaceId");

-- CreateIndex
CREATE INDEX "Meeting_workspaceId_meetStart_idx" ON "Meeting"("workspaceId", "meetStart");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetId_role_idx" ON "MeetingParticipant"("meetId", "role");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetId_idx" ON "MeetingParticipant"("meetId");

-- CreateIndex
CREATE INDEX "MeetingParticipant_userId_idx" ON "MeetingParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetId_userId_key" ON "MeetingParticipant"("meetId", "userId");

-- CreateIndex
CREATE INDEX "Document_workspaceId_idx" ON "Document"("workspaceId");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentChunk_documentId_chunkIndex_key" ON "DocumentChunk"("documentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_dpLead_fkey" FOREIGN KEY ("dpLead") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("workspaceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dpId_fkey" FOREIGN KEY ("dpId") REFERENCES "Department"("dpId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("dpId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_keyPersonId_fkey" FOREIGN KEY ("keyPersonId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("spaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetId_fkey" FOREIGN KEY ("meetId") REFERENCES "Meeting"("meetId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("workspaceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
