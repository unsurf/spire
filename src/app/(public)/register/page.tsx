"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes.constants";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      setError("Server error: invalid response");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      const errSchema = z.object({ error: z.string() });
      const errResult = errSchema.safeParse(data);
      setError(errResult.success ? errResult.data.error : "Registration failed");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push(ROUTES.ONBOARDING);
    router.refresh();
  }

  return (
    <div className="bg-surface-raised rounded-2xl border border-edge p-8">
      <h2 className="text-xl font-semibold text-on-surface mb-6">
        Create your account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full bg-input-bg border border-edge-strong rounded-lg px-3.5 py-2.5 text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-input-bg border border-edge-strong rounded-lg px-3.5 py-2.5 text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full bg-input-bg border border-edge-strong rounded-lg px-3.5 py-2.5 text-input-text placeholder-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="text-error text-sm bg-error-soft border border-error-border rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-strong disabled:opacity-50 disabled:cursor-not-allowed text-on-accent font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-muted text-sm text-center mt-6">
        Already have an account?{" "}
        <Link href={ROUTES.SIGN_IN} className="text-accent hover:text-accent-strong">
          Sign in
        </Link>
      </p>
    </div>
  );
}
