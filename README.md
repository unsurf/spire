# Spire

A self-hosted financial management platform. Track accounts, income, and long-term projections — all on your own infrastructure.

## Features

- Account tracking across multiple categories (savings, investments, loans, and more)
- **Crypto accounts** — live price tracking via CoinGecko, price history charts (1D/1W/1M/1Y), and real-time portfolio value
- **High Growth Savings** accounts with configurable interest rate projections
- Income management with configurable pay cycles and split allocations
- Balance history and growth projections (Oracle)
- Fully self-hosted — your data never leaves your server

## Quick Start (Docker)

**Requirements:** Docker and Docker Compose.

```bash
# 1. Clone the repo
git clone https://github.com/unsurf/spire.git
cd spire

# 2. Configure environment
cp .env.example .env
# Edit .env — set AUTH_SECRET, DATABASE_URL, and optionally NEXTAUTH_URL

# 3. Start
docker compose up -d
```

Spire is now running at `http://localhost:3000`.

On first run, create your account via the register page. The database is initialised automatically.

## Updating

```bash
docker compose pull
docker compose up -d
```

## Configuration

All configuration is via environment variables in `.env`. See `.env.example` for full descriptions.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Random secret for session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes (prod) | Full public URL of your Spire instance |

## Reverse Proxy (Caddy example)

```
spire.example.com {
    reverse_proxy localhost:3000
}
```

Nginx, Traefik, and other proxies work the same way — proxy port 3000.

## Development

```bash
# Install dependencies
npm install

# Generate and apply database migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# Start the dev server
npm run dev

# Lint and format
npm run lint
npx prettier --write .
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Auth.js (NextAuth v5) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Validation | Zod |
| Crypto prices | CoinGecko API |

## Contributing

See [AGENTS.md](AGENTS.md) for code conventions and contributor guidelines.
