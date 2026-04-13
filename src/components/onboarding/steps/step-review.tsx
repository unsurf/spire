"use client";

import { formatCurrency } from "@/lib/currencies";
import { ACCOUNT_CATEGORY_LABELS, PAY_CYCLE_LABELS } from "@/lib/utils";
import type { OnboardingState } from "../onboarding-wizard";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  state: OnboardingState;
  submitting: boolean;
  error: string;
  onSubmit: () => void;
  onBack: () => void;
};

export default function StepReview({
  state,
  submitting,
  error,
  onSubmit,
  onBack,
}: Props) {
  const country = COUNTRIES.find((c) => c.code === state.country);

  return (
    <div>
      <h2 className="text-xl font-semibold text-on-surface mb-1">
        Everything look right?
      </h2>
      <p className="text-muted text-sm mb-6">
        Review your setup before we create everything. You can change any of
        this later.
      </p>

      <div className="space-y-4">
        <div className="bg-edge/30 rounded-xl p-4 border border-edge">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Region
          </p>
          <p className="text-sm text-on-surface">
            {country?.name ?? state.country} · {state.currency}
          </p>
        </div>

        <div className="bg-edge/30 rounded-xl p-4 border border-edge">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Accounts ({state.accounts.length})
          </p>
          <div className="space-y-1">
            {state.accounts.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-on-surface">{a.name}</span>
                <span className="text-muted">
                  {ACCOUNT_CATEGORY_LABELS[a.category]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {state.incomes.map((inc, i) => (
          <div key={i} className="bg-edge/30 rounded-xl p-4 border border-edge">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Income: {inc.name}
              </p>
              <p className="text-xs text-muted">
                {formatCurrency(parseFloat(inc.amount), state.currency)} ·{" "}
                {PAY_CYCLE_LABELS[inc.cycle]}
              </p>
            </div>
            {inc.splits.length === 0 ? (
              <p className="text-sm text-subtle">No splits configured</p>
            ) : (
              <div className="space-y-1">
                {inc.splits
                  .filter((s) => s.value && parseFloat(s.value) > 0)
                  .map((s, si) => {
                    const incomeAmount = parseFloat(inc.amount);
                    const dollarValue =
                      s.type === "PERCENTAGE"
                        ? (incomeAmount * parseFloat(s.value)) / 100
                        : parseFloat(s.value);

                    return (
                      <div
                        key={si}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted">
                          {state.accounts[s.accountIndex]?.name ?? "Unknown"}
                        </span>
                        <span className="text-accent font-medium">
                          {s.type === "PERCENTAGE"
                            ? `${s.value}% · ${formatCurrency(dollarValue, state.currency)}`
                            : formatCurrency(parseFloat(s.value), state.currency)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-error text-sm mt-4 bg-error-soft border border-error-border rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="text-muted hover:text-on-surface transition-colors text-sm font-medium"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-accent hover:bg-accent-strong disabled:opacity-50 text-on-accent font-medium rounded-lg px-6 py-2.5 transition-colors"
        >
          {submitting ? "Setting up..." : "Launch Spire"}
        </button>
      </div>
    </div>
  );
}
