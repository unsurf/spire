import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, accounts, incomes, accountSplits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { onboardingSchema } from "@/lib/schemas/onboarding.schema";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = onboardingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { country, currency, incomes: incomeData, accounts: accountData } = parsed.data;

    const userId = session.user.id;

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ country, currency, onboardingComplete: true })
        .where(eq(users.id, userId));

      const createdAccounts = await Promise.all(
        accountData.map((a) =>
          tx
            .insert(accounts)
            .values({ id: createId(), userId, name: a.name, category: a.category })
            .returning({ id: accounts.id })
            .then((rows) => rows[0]),
        ),
      );

      for (const income of incomeData) {
        const [createdIncome] = await tx
          .insert(incomes)
          .values({
            id: createId(),
            userId,
            name: income.name,
            amount: income.amount.toString(),
            cycle: income.cycle,
            lastPaidAt: income.lastPaidAt ? new Date(income.lastPaidAt) : null,
          })
          .returning({ id: incomes.id });

        for (const split of income.splits) {
          const accountIndex = parseInt(split.accountId, 10);
          const resolvedAccountId =
            !isNaN(accountIndex) && createdAccounts[accountIndex]
              ? createdAccounts[accountIndex].id
              : split.accountId;

          await tx.insert(accountSplits).values({
            id: createId(),
            incomeId: createdIncome.id,
            accountId: resolvedAccountId,
            type: split.type,
            value: split.value.toString(),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
