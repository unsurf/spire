ALTER TABLE "User" ADD COLUMN "basiqUserId" text;

CREATE TABLE "BankConnection" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "basiqConnectionId" text NOT NULL,
  "institution" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "BankConnection_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "BankAccountLink" (
  "id" text PRIMARY KEY NOT NULL,
  "bankConnectionId" text NOT NULL,
  "spireAccountId" text,
  "basiqAccountId" text NOT NULL,
  "basiqAccountName" text NOT NULL,
  "lastSyncedAt" timestamp,
  CONSTRAINT "BankAccountLink_bankConnectionId_BankConnection_id_fk" FOREIGN KEY ("bankConnectionId") REFERENCES "public"."BankConnection"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "BankAccountLink_spireAccountId_Account_id_fk" FOREIGN KEY ("spireAccountId") REFERENCES "public"."Account"("id") ON DELETE set null ON UPDATE no action
);

CREATE UNIQUE INDEX "BankAccountLink_basiqAccountId_unique" ON "BankAccountLink" ("basiqAccountId");
