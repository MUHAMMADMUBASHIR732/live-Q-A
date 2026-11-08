-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "presenterToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cluster" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "clusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upvote" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "voterToken" TEXT NOT NULL,

    CONSTRAINT "Upvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_joinCode_key" ON "Session"("joinCode");

-- CreateIndex
CREATE INDEX "Question_sessionId_idx" ON "Question"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_questionId_voterToken_key" ON "Upvote"("questionId", "voterToken");

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
