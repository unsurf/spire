"use client";

import NumberFlow from "@number-flow/react";
import { useVisibility } from "@/lib/visibility-context";
import { getCurrency } from "@/lib/currencies";

type Props = {
  amount: number;
  currency: string;
  className?: string;
};

export default function MaskedValue({ amount, currency, className }: Props) {
  const { hidden } = useVisibility();
  const curr = getCurrency(currency);

  if (hidden) {
    return <span className={className}>{"\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}</span>;
  }

  return (
    <NumberFlow
      value={amount}
      format={{
        style: "currency",
        currency: curr?.code ?? "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }}
      className={className}
    />
  );
}
