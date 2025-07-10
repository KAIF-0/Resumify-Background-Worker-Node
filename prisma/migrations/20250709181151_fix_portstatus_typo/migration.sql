/*
  Warnings:

  - The values [PROCCESING] on the enum `PortStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PortStatus_new" AS ENUM ('READY', 'PROCESSING', 'ERROR');
ALTER TABLE "Portfolio" ALTER COLUMN "status" TYPE "PortStatus_new" USING ("status"::text::"PortStatus_new");
ALTER TYPE "PortStatus" RENAME TO "PortStatus_old";
ALTER TYPE "PortStatus_new" RENAME TO "PortStatus";
DROP TYPE "PortStatus_old";
COMMIT;
