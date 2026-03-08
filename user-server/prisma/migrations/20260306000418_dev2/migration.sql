-- CreateEnum
CREATE TYPE "VisibilityPolicy" AS ENUM ('LECTURE', 'ASSIGNMENT', 'EXAM', 'SOLUTION', 'HIGHLY_SENSITIVE');

-- CreateTable
CREATE TABLE "resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "topic" TEXT,
    "instructor" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentType" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "policy" "VisibilityPolicy" NOT NULL DEFAULT 'LECTURE',
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_objectKey_key" ON "resource"("objectKey");

-- CreateIndex
CREATE INDEX "access_log_userId_idx" ON "access_log"("userId");

-- CreateIndex
CREATE INDEX "access_log_resourceId_idx" ON "access_log"("resourceId");

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
