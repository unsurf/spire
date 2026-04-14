"use client";

import { useState } from "react";
import { AccountTypePicker } from "./account-type-picker.component";
import { BankAccountForm } from "./bank-account-form.component";
import { HighGrowthForm } from "./high-growth-form.component";
import { CryptoForm } from "./crypto-form.component";
import type { AddAccountModalProps, ModalStep } from "./add-account-modal.types";

export function AddAccountModal({ onClose, onAdded, currency }: AddAccountModalProps) {
  const [step, setStep] = useState<ModalStep>("picker");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {step === "picker" && <AccountTypePicker onSelect={setStep} onClose={onClose} />}
      {step === "bank-account" && (
        <BankAccountForm onBack={() => setStep("picker")} onClose={onClose} onAdded={onAdded} />
      )}
      {step === "high-growth" && (
        <HighGrowthForm onBack={() => setStep("picker")} onClose={onClose} onAdded={onAdded} />
      )}
      {step === "crypto" && (
        <CryptoForm
          onBack={() => setStep("picker")}
          onClose={onClose}
          onAdded={onAdded}
          currency={currency}
        />
      )}
    </div>
  );
}
