"use client";

import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";

const inputClassName =
  "w-full bg-input-bg border border-edge-strong rounded-lg px-3.5 py-2.5 text-input-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors";

type Props = {
  country: string;
  currency: string;
  onChange: (country: string, currency: string) => void;
  onNext: () => void;
};

export default function StepRegion({ country, currency, onChange, onNext }: Props) {
  function handleCountryChange(code: string) {
    const c = COUNTRIES.find((c) => c.code === code);
    onChange(code, c?.currency ?? currency);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-on-surface mb-1">
        Where are you based?
      </h2>
      <p className="text-muted text-sm mb-6">
        This sets your default currency for all balances and projections.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={inputClassName}
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => onChange(country, e.target.value)}
            className={inputClassName}
          >
            <option value="">Select currency</option>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={!country || !currency}
          className="bg-accent hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed text-on-accent font-medium rounded-lg px-6 py-2.5 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
