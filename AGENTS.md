# Spire — Agent & Contributor Guidelines

<!-- BEGIN:nextjs-agent-rules -->
## Next.js Version Notice

This is **NOT** the Next.js you know. APIs, conventions, and file structure may differ from training data.
**Read `node_modules/next/dist/docs/` before writing any code. Heed all deprecation notices.**
<!-- END:nextjs-agent-rules -->

---

Spire is a self-hosted financial management platform. It is open-source. Every code change must be atomic, reviewable, and maintainable by a contributor who has never seen this repo before.

**Read all sections before touching code.**

---

## Table of Contents

1. [Component Structure](#1-component-structure)
2. [TypeScript Standards](#2-typescript-standards)
3. [Constants & Magic Strings](#3-constants--magic-strings)
4. [Design Tokens & Styling](#4-design-tokens--styling)
5. [Routing](#5-routing)
6. [Props & State](#6-props--state)
7. [API Routes](#7-api-routes)
8. [File Organisation](#8-file-organisation)
9. [Anti-Patterns Reference](#9-anti-patterns-reference)

---

## 1. Component Structure

Every non-trivial component lives in its own directory. **No exceptions.**

```
src/components/<name>/
  <name>.component.tsx   ← React component(s)
  <name>.types.ts        ← All types/interfaces for this component
  <name>.utils.ts        ← Pure functions used by this component
  <name>.constants.ts    ← Constants scoped to this component
  index.ts               ← Re-export only: export { default } from "./<name>.component"
```

### Rules

- **One concern per file.** No logic in `.component.tsx` beyond wiring state to JSX.
- **No types defined inside `.component.tsx`.** Put them in `.types.ts`.
- **No inline constants.** Repeated or named values go in `.constants.ts` or `src/lib/constants/`.
- **Pure functions only in `.utils.ts`.** No side effects, no React imports.
- The `index.ts` barrel is the only public surface. Internal files are implementation detail.

### Example

```
src/components/account-card/
  account-card.component.tsx
  account-card.types.ts
  account-card.utils.ts
  account-card.constants.ts
  index.ts
```

```ts
// account-card.types.ts
export type AccountCardProps = {
  account: DashboardAccount;
  currency: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
};
```

```ts
// index.ts
export { AccountCard } from "./account-card.component";
export type { AccountCardProps } from "./account-card.types";
```

---

## 2. TypeScript Standards

### Never use `as` to cast types

```ts
// WRONG — masks real type errors
const category = req.body.category as AccountCategory;
const data = result as any[];
const user = session.user as { onboardingComplete?: boolean };

// RIGHT — validate at the boundary, then type flows naturally
import { z } from "zod";
const schema = z.object({ category: z.nativeEnum(AccountCategory) });
const { category } = schema.parse(req.body);
```

### Never use `as any`

If you reach for `as any`, stop. Either:
- Create a proper discriminated union type
- Use a type predicate / guard
- Fix the upstream type

The only legitimate `any` usage is third-party library interop where no types exist — and it must be wrapped in a typed utility function so `any` does not leak.

### No `unknown` props

```ts
// WRONG
onAdded: (account: unknown) => void;

// RIGHT
onAdded: (account: DashboardAccount) => void;
```

### Prefer `type` over `interface` for object shapes

```ts
// Preferred
type AccountCardProps = { ... };

// Use interface only for declaration merging (rare)
```

### Validate all external data with Zod

All data from: API responses, URL params, form inputs, `JSON.parse` — must pass through a Zod schema before use.

```ts
// src/lib/schemas/account.schema.ts
import { z } from "zod";
import { AccountCategory } from "@/generated/prisma/client";

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.nativeEnum(AccountCategory),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
```

### Never use index as React key

```ts
// WRONG
list.map((item, i) => <Row key={i} ... />)

// RIGHT — use stable unique ID
list.map((item) => <Row key={item.id} ... />)
```

---

## 3. Constants & Magic Strings

### Rule: if a value appears more than once, it is a constant

```ts
// WRONG — same string in 3 files
["6m", "1y", "2y", "3y"].map(...)

// RIGHT — defined once, imported everywhere
// src/lib/constants/oracle.constants.ts
export const ORACLE_HORIZONS = ["6m", "1y", "2y", "3y"] as const;
export type OracleHorizon = typeof ORACLE_HORIZONS[number];
```

### Constants directory layout

```
src/lib/constants/
  routes.constants.ts      ← All app routes and URL builders
  oracle.constants.ts      ← Oracle horizon options
  pay-cycles.constants.ts  ← Pay cycle labels/options
  navigation.constants.ts  ← Nav items
  dates.constants.ts       ← Month names, day arrays
```

### Route constants

```ts
// src/lib/constants/routes.constants.ts
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  DASHBOARD_ACCOUNT: (id: string) => `/dashboard?account=${id}`,
  ACCOUNT_DETAIL: (id: string) => `/accounts/${id}`,
  INCOME: "/income",
  SETTINGS: "/settings",
  SIGN_IN: "/auth/signin",
  REGISTER: "/auth/register",
  ONBOARDING: "/onboarding",
} as const;
```

### Never hardcode query param names

```ts
// WRONG
href={`/dashboard?account=${id}`}
searchParams: Promise<{ account?: string }>;

// RIGHT — import from constants
import { ROUTES, QUERY_PARAMS } from "@/lib/constants/routes.constants";
href={ROUTES.DASHBOARD_ACCOUNT(id)}

// src/lib/constants/routes.constants.ts
export const QUERY_PARAMS = {
  ACCOUNT: "account",
} as const;
```

---

## 4. Design Tokens & Styling

### Always use design tokens, never raw colours

The design system tokens are defined in `src/app/globals.css` and exposed via Tailwind:

| Token class          | CSS variable          | Use for                        |
|----------------------|-----------------------|--------------------------------|
| `bg-surface`         | `--surface`           | Page/main backgrounds          |
| `bg-surface-raised`  | `--surface-raised`    | Cards, panels                  |
| `text-on-surface`    | `--on-surface`        | Primary text                   |
| `text-muted`         | `--muted`             | Secondary/helper text          |
| `text-subtle`        | `--subtle`            | Placeholder, disabled          |
| `border-edge`        | `--edge`              | Subtle borders                 |
| `border-edge-strong` | `--edge-strong`       | Prominent borders              |
| `bg-input-bg`        | `--input-bg`          | Input backgrounds              |
| `text-input-text`    | `--input-text`        | Input text                     |
| `bg-accent`          | `--accent`            | Primary CTA, active states     |
| `bg-accent-strong`   | `--accent-strong`     | Hover state for accent         |
| `bg-accent-soft`     | `--accent-soft`       | Subtle accent backgrounds      |
| `text-on-accent`     | `--on-accent`         | Text on accent backgrounds     |
| `text-positive`      | `--positive`          | Positive deltas, gains, growth |
| `bg-positive-soft`   | `--positive-soft`     | Subtle positive backgrounds    |
| `text-error`         | `--error`             | Error / destructive text       |
| `text-error-strong`  | `--error-strong`      | High-contrast error text       |
| `bg-error-soft`      | `--error-soft`        | Error message backgrounds      |
| `border-error-border`| `--error-border`      | Error message borders          |
| `bg-error-strong`    | `--error-strong`      | Destructive action buttons     |
| `text-on-error`      | `--on-error`          | Text on error backgrounds      |

```tsx
// WRONG — hardcoded Tailwind colour or hex
<button className="bg-emerald-600 hover:bg-emerald-500 text-white">
<stop stopColor="#10b981" />
color="#ff7a1a"

// RIGHT — design tokens
<button className="bg-accent hover:bg-accent-strong text-on-accent">
<stop stopColor="var(--accent)" />
color="var(--accent)"
```

### No inline `style` when a Tailwind utility exists

```tsx
// WRONG
style={{ pointerEvents: "none" }}

// RIGHT
className="pointer-events-none"
```

### Never use arbitrary Tailwind values for colours

```tsx
// WRONG
className="bg-[#1a1a1a] text-[#fafafa]"

// RIGHT
className="bg-surface-raised text-on-surface"
```

---

## 5. Routing

### Use `ROUTES` constants everywhere

```tsx
import { ROUTES } from "@/lib/constants/routes.constants";

// Navigation
<Link href={ROUTES.INCOME}>Income</Link>

// Redirect
redirect(ROUTES.DASHBOARD);

// Dynamic
<Link href={ROUTES.ACCOUNT_DETAIL(account.id)}>View</Link>
```

### Protect routes with middleware

All routes under `(protected)/` are guarded by the auth middleware in `src/auth.ts`. Never check auth inside page components — if a page is in `(protected)/`, it is already auth-guarded.

### Type URL search params

```ts
// src/app/(protected)/dashboard/page.tsx
type DashboardSearchParams = {
  [QUERY_PARAMS.ACCOUNT]?: string;
};

type Props = {
  searchParams: Promise<DashboardSearchParams>;
};
```

---

## 6. Props & State

### No prop drilling beyond 1 level

If a value needs to reach a grandchild, use React Context or lift the component boundary.

```tsx
// WRONG — passing currency through 3 levels
<Dashboard currency={currency}>
  <Panel currency={currency}>
    <Chart currency={currency} />

// RIGHT — Context or co-locate
const CurrencyContext = createContext<string>("USD");
// Provide once at the layout level, consume anywhere
```

### Wizard/multi-step state

Use `useReducer` + context rather than threading `onChange`/`onNext`/`onBack` through every step component.

```tsx
// src/components/onboarding-wizard/onboarding-wizard.context.tsx
type WizardAction = { type: "NEXT" } | { type: "BACK" } | { type: "SET_STEP"; payload: number };
```

### Extract complex derived state to utils

```ts
// WRONG — 20-line useMemo inside component
const chartData = useMemo(() => {
  // complex projection logic...
}, [accounts, horizon]);

// RIGHT — pure function in utils file
// dashboard-client.utils.ts
export function buildChartData(accounts: DashboardAccount[], horizon: OracleHorizon): ChartDataPoint[] {
  // ...
}
```

---

## 7. API Routes

### Validate all request bodies with Zod

```ts
// src/app/api/accounts/route.ts
import { createAccountSchema } from "@/lib/schemas/account.schema";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createAccountSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // parsed.data is fully typed — no `as` needed
  const account = await prisma.account.create({ data: { ...parsed.data, userId } });
  return Response.json(account);
}
```

### Always check auth in API routes

```ts
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

### Return typed responses

Define response types in `src/lib/schemas/` and share them between API routes and client components.

---

## 8. File Organisation

```
src/
  app/
    (protected)/         ← Auth-guarded pages
    (public)/            ← Public pages (auth, etc.)
    api/                 ← API routes
    globals.css          ← Design tokens only
    layout.tsx
    page.tsx
  components/
    <name>/              ← ALWAYS a directory
      <name>.component.tsx
      <name>.types.ts        ← only if needed
      <name>.utils.ts        ← only if needed
      <name>.constants.ts    ← only if needed
      index.ts
  lib/
    constants/           ← App-wide constants
      routes.constants.ts
      oracle.constants.ts
      pay-cycles.constants.ts
      navigation.constants.ts
      dates.constants.ts
    schemas/             ← Zod schemas
      account.schema.ts
      income.schema.ts
      user.schema.ts
    utils/               ← Pure utility functions
      currency.utils.ts
      date.utils.ts
      balance.utils.ts
  auth.ts
  auth.config.ts
```

### No logic in page files

Page files (`app/**/page.tsx`) should only:
1. Fetch data (Prisma queries)
2. Handle auth redirects
3. Pass serialized data to a `<FeatureNameClient>` component

**Serialization belongs in a utility function**, not inline in the page:

```ts
// WRONG
const accounts = JSON.parse(JSON.stringify(rawAccounts));

// RIGHT — src/lib/utils/prisma-serialise.ts
export function serialiseAccounts(accounts: PrismaAccount[]): DashboardAccount[] { ... }
```

---

## 9. Anti-Patterns Reference

These patterns were found in the codebase and must not be repeated.

| Pattern | Why it's wrong | Fix |
|---------|---------------|-----|
| `value as SomeType` | Masks type errors, breaks at runtime | Validate with Zod, fix the upstream type |
| `as any` | Disables type safety entirely | Create a proper union or type guard |
| `unknown` in props | Lazy typing, forces callers to cast | Use the real type |
| `key={index}` | Causes incorrect reconciliation | Use `key={item.id}` |
| `["6m","1y"]` inline | Magic string arrays, hard to refactor | Export from constants |
| `href="/income"` inline | Routes scattered, breaks en masse | Use `ROUTES` constants |
| `bg-emerald-600` | Hardcoded colour, ignores design system | Use `bg-accent` |
| `style={{ pointerEvents }}` | Bypasses Tailwind | Use `pointer-events-none` |
| `JSON.parse(JSON.stringify(...))` | Untyped serialisation | Use typed serialisation utility |
| Defining types inside `.component.tsx` | Impossible to import without importing component | Put in `.types.ts` |
| Component defined in page file | Can't be tested or reused | Extract to `components/` |
| Props drilling 2+ levels | Fragile, hard to refactor | Context or restructure |
| Months/days arrays inline | Repeated initialisation | `src/lib/constants/dates.constants.ts` |
| `PAY_CYCLES` rebuilt in each component | Duplicated initialisation | `src/lib/constants/pay-cycles.constants.ts` |
| Chart config repeated in 4 files | Any change requires 4 edits | Shared chart component |
| No error handling on API fetch | Silent failures | Try/catch + error state |
| No Zod on API request body | Crashes on unexpected input | Zod schema per route |

---

## Contributing

1. **One component = one PR.** Don't refactor unrelated files in the same branch.
2. **Types first.** Write the `.types.ts` file before the component.
3. **Constants before code.** If you need a string or number constant, add it to the relevant constants file first.
4. **No new magic strings.** If you add a route, add it to `ROUTES`. If you add a query param, add it to `QUERY_PARAMS`.
5. **All new API routes need Zod validation.**
6. **Run `tsc --noEmit` before pushing.** Zero type errors.
