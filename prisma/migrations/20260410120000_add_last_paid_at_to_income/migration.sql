-- Add last paid date for frequency-based scheduling
ALTER TABLE "Income"
ADD COLUMN "lastPaidAt" TIMESTAMP(3);
