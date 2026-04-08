/*
  Warnings:

  - You are about to drop the column `client` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Process" DROP COLUMN "client",
DROP COLUMN "createdAt",
DROP COLUMN "number",
DROP COLUMN "status",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "officeId" TEXT NOT NULL DEFAULT 'TEMP_ID',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Sem título';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
ADD COLUMN     "officeId" TEXT NOT NULL DEFAULT 'TEMP_ID',
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
