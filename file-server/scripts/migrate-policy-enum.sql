-- Migrate VisibilityPolicy enum from content-based to role-based values.
-- Run this against your PostgreSQL database BEFORE running `prisma db push`.
--
-- Old values → New values:
--   LECTURE          → STUDENT
--   ASSIGNMENT       → STUDENT
--   EXAM             → TA
--   SOLUTION         → TA
--   HIGHLY_SENSITIVE → INSTRUCTOR

-- Step 1: Add new enum type
CREATE TYPE "VisibilityPolicy_new" AS ENUM ('STUDENT', 'TA', 'INSTRUCTOR');

-- Step 2: Migrate existing rows
ALTER TABLE "resource"
  ALTER COLUMN "policy" DROP DEFAULT,
  ALTER COLUMN "policy" TYPE "VisibilityPolicy_new"
    USING CASE "policy"::text
      WHEN 'LECTURE'          THEN 'STUDENT'
      WHEN 'ASSIGNMENT'       THEN 'STUDENT'
      WHEN 'EXAM'             THEN 'TA'
      WHEN 'SOLUTION'         THEN 'TA'
      WHEN 'HIGHLY_SENSITIVE' THEN 'INSTRUCTOR'
      ELSE 'STUDENT'
    END::"VisibilityPolicy_new",
  ALTER COLUMN "policy" SET DEFAULT 'STUDENT';

-- Step 3: Replace old enum type
DROP TYPE "VisibilityPolicy";
ALTER TYPE "VisibilityPolicy_new" RENAME TO "VisibilityPolicy";
