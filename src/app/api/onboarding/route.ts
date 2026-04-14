import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { onboardingSchema } from "@/lib/schemas/onboarding.schema";

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
    const { country, currency, incomes, accounts } = parsed.data;

    const userId = session.user.id;

    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: userId },
        data: { country, currency, onboardingComplete: true },
      });

      // Create accounts and get their IDs
      const createdAccounts = await Promise.all(
        accounts.map((a) =>
          tx.account.create({
            data: { userId, name: a.name, category: a.category },
          })
        )
      );

      // Map temp index to real account id for splits
      // incomes contain splits with accountId = temp index string like "new-0"
      // We resolve by matching order
      for (const income of incomes) {
        const createdIncome = await tx.income.create({
          data: {
            userId,
            name: income.name,
            amount: income.amount,
            cycle: income.cycle,
            lastPaidAt: income.lastPaidAt ? new Date(income.lastPaidAt) : null,
          },
        });

        for (const split of income.splits) {
          // accountId is either a real id (post-onboarding) or index like "0","1"
          const accountIndex = parseInt(split.accountId, 10);
          const resolvedAccountId =
            !isNaN(accountIndex) && createdAccounts[accountIndex]
              ? createdAccounts[accountIndex].id
              : split.accountId;

          await tx.accountSplit.create({
            data: {
              incomeId: createdIncome.id,
              accountId: resolvedAccountId,
              type: split.type,
              value: split.value,
            },
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
