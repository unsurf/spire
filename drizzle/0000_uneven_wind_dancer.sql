CREATE TYPE "public"."AccountCategory" AS ENUM('CHEQUE', 'SAVINGS', 'HIGH_GROWTH', 'EMERGENCY', 'INVESTMENT', 'CRYPTO', 'ASSET', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."BillCategory" AS ENUM('LIVING_EXPENSES', 'SUBSCRIPTIONS');--> statement-breakpoint
CREATE TYPE "public"."BillCycle" AS ENUM('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME');--> statement-breakpoint
CREATE TYPE "public"."BillSubcategory" AS ENUM('RENT', 'ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'GROCERIES', 'HOME_INSURANCE', 'PHONE', 'COUNCIL_RATES', 'SOCIAL', 'STREAMING', 'DATA_STORAGE', 'TOOLS', 'AI', 'SHOPPING_DELIVERY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."PayCycle" AS ENUM('WEEKLY', 'FORTNIGHTLY', 'TWICE_MONTHLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY');--> statement-breakpoint
CREATE TYPE "public"."SplitType" AS ENUM('PERCENTAGE', 'FIXED');--> statement-breakpoint
CREATE TYPE "public"."TradeType" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TABLE "AccountSplit" (
	"id" text PRIMARY KEY NOT NULL,
	"incomeId" text NOT NULL,
	"accountId" text NOT NULL,
	"type" "SplitType" NOT NULL,
	"value" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"category" "AccountCategory" NOT NULL,
	"oracleEnabled" boolean DEFAULT true NOT NULL,
	"annualGrowthRate" real,
	"coinId" text,
	"coinSymbol" text,
	"coinQuantity" numeric(18, 8),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BalanceEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"balance" numeric(12, 2) NOT NULL,
	"note" text,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Bill" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(12, 2),
	"accountId" text,
	"cycle" "BillCycle" NOT NULL,
	"startDate" timestamp NOT NULL,
	"category" "BillCategory",
	"subcategory" "BillSubcategory",
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Goal" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"targetAmount" numeric(12, 2) NOT NULL,
	"accountId" text,
	"deadline" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Income" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"cycle" "PayCycle" NOT NULL,
	"lastPaidAt" timestamp,
	"payDay" integer,
	"payDay2" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Trade" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"type" "TradeType" NOT NULL,
	"quantity" numeric(18, 8) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"tradedAt" timestamp NOT NULL,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"country" text,
	"currency" text,
	"onboardingComplete" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "AccountSplit" ADD CONSTRAINT "AccountSplit_incomeId_Income_id_fk" FOREIGN KEY ("incomeId") REFERENCES "public"."Income"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AccountSplit" ADD CONSTRAINT "AccountSplit_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BalanceEntry" ADD CONSTRAINT "BalanceEntry_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "AccountSplit_incomeId_accountId_key" ON "AccountSplit" USING btree ("incomeId","accountId");