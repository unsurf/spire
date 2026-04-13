"use client";

import { useVisibility } from "@/lib/visibility-context";
import { formatCurrency } from "@/lib/currencies";

type Props = {
  amount: number;
  currency: string;
  className?: string;
};

export default function MaskedValue({
  amount,
  currency,
  className,
}: Props) {
  const { hidden } = useVisibility();

  return (
    <span className={className}>
      {hidden ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : formatCurrency(amount, currency)}
    </span>
  );
}
