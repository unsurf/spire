import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  numeric,
  real,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const payCycleEnum = pgEnum("PayCycle", [
  "WEEKLY",
  "FORTNIGHTLY",
  "TWICE_MONTHLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
]);

export const accountCategoryEnum = pgEnum("AccountCategory", [
  "CHEQUE",
  "SAVINGS",
  "HIGH_GROWTH",
  "EMERGENCY",
  "INVESTMENT",
  "CRYPTO",
  "ASSET",
  "OTHER",
]);

export const splitTypeEnum = pgEnum("SplitType", ["PERCENTAGE", "FIXED"]);

export const tradeTypeEnum = pgEnum("TradeType", ["BUY", "SELL"]);

export const billCycleEnum = pgEnum("BillCycle", [
  "DAILY",
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
  "ONE_TIME",
]);

export const billCategoryEnum = pgEnum("BillCategory", [
  "LIVING_EXPENSES",
  "SUBSCRIPTIONS",
]);

export const billSubcategoryEnum = pgEnum("BillSubcategory", [
  "RENT",
  "ELECTRICITY",
  "WATER",
  "GAS",
  "INTERNET",
  "GROCERIES",
  "HOME_INSURANCE",
  "PHONE",
  "COUNCIL_RATES",
  "SOCIAL",
  "STREAMING",
  "DATA_STORAGE",
  "TOOLS",
  "AI",
  "SHOPPING_DELIVERY",
  "OTHER",
]);

// ─── Inferred enum types ───────────────────────────────────────────────────────

export type PayCycle = (typeof payCycleEnum.enumValues)[number];
export type AccountCategory = (typeof accountCategoryEnum.enumValues)[number];
export type SplitType = (typeof splitTypeEnum.enumValues)[number];
export type TradeType = (typeof tradeTypeEnum.enumValues)[number];
export type BillCycle = (typeof billCycleEnum.enumValues)[number];
export type BillCategory = (typeof billCategoryEnum.enumValues)[number];
export type BillSubcategory = (typeof billSubcategoryEnum.enumValues)[number];

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("User", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  country: text("country"),
  currency: text("currency"),
  onboardingComplete: boolean("onboardingComplete").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const incomes = pgTable("Income", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  cycle: payCycleEnum("cycle").notNull(),
  lastPaidAt: timestamp("lastPaidAt", { mode: "date" }),
  payDay: integer("payDay"),
  payDay2: integer("payDay2"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable("Account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: accountCategoryEnum("category").notNull(),
  oracleEnabled: boolean("oracleEnabled").notNull().default(true),
  annualGrowthRate: real("annualGrowthRate"),
  coinId: text("coinId"),
  coinSymbol: text("coinSymbol"),
  coinQuantity: numeric("coinQuantity", { precision: 18, scale: 8 }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const trades = pgTable("Trade", {
  id: text("id").primaryKey(),
  accountId: text("accountId")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  type: tradeTypeEnum("type").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  tradedAt: timestamp("tradedAt", { mode: "date" }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const accountSplits = pgTable(
  "AccountSplit",
  {
    id: text("id").primaryKey(),
    incomeId: text("incomeId")
      .notNull()
      .references(() => incomes.id, { onDelete: "cascade" }),
    accountId: text("accountId")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    type: splitTypeEnum("type").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [uniqueIndex("AccountSplit_incomeId_accountId_key").on(table.incomeId, table.accountId)],
);

export const bills = pgTable("Bill", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  accountId: text("accountId").references(() => accounts.id, {
    onDelete: "set null",
  }),
  cycle: billCycleEnum("cycle").notNull(),
  startDate: timestamp("startDate", { mode: "date" }).notNull(),
  category: billCategoryEnum("category"),
  subcategory: billSubcategoryEnum("subcategory"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const balanceEntries = pgTable("BalanceEntry", {
  id: text("id").primaryKey(),
  accountId: text("accountId")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  recordedAt: timestamp("recordedAt", { mode: "date" }).notNull().defaultNow(),
});

export const goals = pgTable("Goal", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("targetAmount", { precision: 12, scale: 2 }).notNull(),
  accountId: text("accountId").references(() => accounts.id, {
    onDelete: "set null",
  }),
  deadline: timestamp("deadline", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  incomes: many(incomes),
  accounts: many(accounts),
  bills: many(bills),
  goals: many(goals),
}));

export const incomesRelations = relations(incomes, ({ one, many }) => ({
  user: one(users, { fields: [incomes.userId], references: [users.id] }),
  splits: many(accountSplits),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  splits: many(accountSplits),
  balanceEntries: many(balanceEntries),
  bills: many(bills),
  trades: many(trades),
  goals: many(goals),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  account: one(accounts, { fields: [trades.accountId], references: [accounts.id] }),
}));

export const accountSplitsRelations = relations(accountSplits, ({ one }) => ({
  income: one(incomes, { fields: [accountSplits.incomeId], references: [incomes.id] }),
  account: one(accounts, { fields: [accountSplits.accountId], references: [accounts.id] }),
}));

export const billsRelations = relations(bills, ({ one }) => ({
  user: one(users, { fields: [bills.userId], references: [users.id] }),
  account: one(accounts, { fields: [bills.accountId], references: [accounts.id] }),
}));

export const balanceEntriesRelations = relations(balanceEntries, ({ one }) => ({
  account: one(accounts, { fields: [balanceEntries.accountId], references: [accounts.id] }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  account: one(accounts, { fields: [goals.accountId], references: [accounts.id] }),
}));
