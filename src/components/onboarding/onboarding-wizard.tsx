"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepRegion from "./steps/step-region";
import StepIncome from "./steps/step-income";
import StepAccounts from "./steps/step-accounts";
import StepSplits from "./steps/step-splits";
import StepReview from "./steps/step-review";
import { ROUTES } from "@/lib/constants/routes.constants";
import type {
  IncomeInput,
  AccountInput,
  SplitInput,
  IncomeWithSplits,
  OnboardingState,
} from "./onboarding-wizard.types";

export type {
  IncomeInput,
  AccountInput,
  SplitInput,
  IncomeWithSplits,
  OnboardingState,
};

const STEPS = [
  { label: "Region" },
  { label: "Income" },
  { label: "Accounts" },
  { label: "Splits" },
  { label: "Review" },
] as const;

type Props = { userName: string };

export default function OnboardingWizard({ userName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [state, setState] = useState<OnboardingState>({
    country: "",
    currency: "",
    incomes: [],
    accounts: [],
  });

  function update(patch: Partial<OnboardingState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    const payload = {
      country: state.country,
      currency: state.currency,
      accounts: state.accounts,
      incomes: state.incomes.map((inc) => ({
        name: inc.name,
        amount: parseFloat(inc.amount),
        cycle: inc.cycle,
        payDay: inc.payDay !== "" ? parseInt(inc.payDay) : null,
        payDay2: inc.payDay2 !== "" ? parseInt(inc.payDay2) : null,
        splits: inc.splits
          .filter((s) => s.value && parseFloat(s.value) > 0)
          .map((s) => ({
            accountId: String(s.accountIndex),
            type: s.type,
            value: parseFloat(s.value),
          })),
      })),
    };

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    router.push(ROUTES.DASHBOARD);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Spire</h1>
          <p className="text-muted mt-1">
            Welcome, {userName.split(" ")[0] || "there"}. Let&apos;s get you set up.
          </p>
        </div>

        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i < step
                      ? "bg-accent text-on-accent"
                      : i === step
                        ? "bg-accent text-on-accent ring-2 ring-accent/30"
                        : "bg-edge text-subtle"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${
                    i === step ? "text-on-surface" : "text-subtle"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-3 ${i < step ? "bg-accent" : "bg-edge"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface-raised rounded-2xl border border-edge p-8">
          {step === 0 && (
            <StepRegion
              country={state.country}
              currency={state.currency}
              onChange={(country, currency) => update({ country, currency })}
              onNext={next}
            />
          )}
          {step === 1 && (
            <StepIncome
              incomes={state.incomes}
              onChange={(incomes) => update({ incomes })}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 2 && (
            <StepAccounts
              accounts={state.accounts}
              onChange={(accounts) => update({ accounts })}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <StepSplits
              incomes={state.incomes}
              accounts={state.accounts}
              currency={state.currency}
              onChange={(incomes) => update({ incomes })}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 4 && (
            <StepReview
              state={state}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
              onBack={back}
            />
          )}
        </div>
      </div>
    </div>
  );
}
