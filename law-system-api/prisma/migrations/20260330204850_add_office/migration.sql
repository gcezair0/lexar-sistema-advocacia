/*
  Warnings:

  - You are about to drop the column `description` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `officeId` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `officeId` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `client` to the `Process` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Process` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Process" DROP CONSTRAINT "Process_officeId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_officeId_fkey";

-- AlterTable
ALTER TABLE "Process" DROP COLUMN "description",
DROP COLUMN "officeId",
DROP COLUMN "title",
ADD COLUMN     "client" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "status" "ProcessStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "officeId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'LAWYER';
