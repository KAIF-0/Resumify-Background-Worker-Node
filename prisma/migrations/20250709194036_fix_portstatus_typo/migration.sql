/*
  Warnings:

  - Made the column `title` on table `PortfolioData` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Education" DROP CONSTRAINT "Education_portfolioId_fkey";

-- DropForeignKey
ALTER TABLE "Experience" DROP CONSTRAINT "Experience_portfolioId_fkey";

-- DropForeignKey
ALTER TABLE "Portfolio" DROP CONSTRAINT "Portfolio_portfolioId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_portfolioId_fkey";

-- DropForeignKey
ALTER TABLE "SkillCategory" DROP CONSTRAINT "SkillCategory_portfolioDataId_fkey";

-- AlterTable
ALTER TABLE "PortfolioData" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "summary" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "PortfolioData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "PortfolioData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "PortfolioData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "PortfolioData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillCategory" ADD CONSTRAINT "SkillCategory_portfolioDataId_fkey" FOREIGN KEY ("portfolioDataId") REFERENCES "PortfolioData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
