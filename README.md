# Spire

A self-hosted financial management platform. Track accounts, income, and long-term projections — all on your own infrastructure.

## Features

- Account tracking across multiple categories (savings, investments, loans, and more)
- **Crypto accounts** — live price tracking via CoinGecko, price history charts (1D/1W/1M/1Y), and real-time portfolio value
- **High Growth Savings** accounts with configurable interest rate projections
- Income management with configurable pay cycles and split allocations
- Balance history and growth projections (Oracle)
- Fully self-hosted — your data never leaves your server

## Docker Image

Pre-built images are published to Docker Hub on every push to `main` and on every release tag.

```
docker pull unsurf/spire:latest
```

**Available tags**

| Tag | When it updates |
|---|---|
| `latest` | Every push to `main` |
| `main` | Every push to `main` |
| `1.2.3` | On a `v1.2.3` git tag |
| `1.2` | On a `v1.2.*` git tag |

**Supported architectures**

| Architecture | Runs on |
|---|---|
| `linux/amd64` | Standard x86-64 servers, VMs, most cloud providers |
| `linux/arm64` | Raspberry Pi 4/5, Oracle Ampere, AWS Graviton, Apple Silicon VMs |

Docker will automatically pull the correct variant for your platform.

## Quick Start

**Requirements:** Docker and Docker Compose.

```bash
mkdir spire && cd spire
curl -sL -o docker-compose.yml https://raw.githubusercontent.com/unsurf/spire/main/docker-compose.yml
curl -sL -o .env.example https://raw.githubusercontent.com/unsurf/spire/main/.env.example
cp .env.example .env
```

Edit `.env` — at minimum set `AUTH_SECRET` and `NEXTAUTH_URL`, then:

```bash
docker compose up -d
```

Spire is now running at `http://localhost:3000` (or whichever `APP_PORT` you set).

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
| `APP_PORT` | No | Port Spire listens on (default: `3000`). Update `NEXTAUTH_URL` to match. |

## Reverse Proxy (Caddy example)

```
spire.example.com {
    reverse_proxy localhost:3000  # change if APP_PORT is set
}
```

Nginx, Traefik, and other proxies work the same way — proxy whichever port `APP_PORT` is set to (default `3000`).

## Development

To build and run from source, use the dev override:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Or run the Next.js dev server directly:

```bash
# Clone and install
git clone https://github.com/unsurf/spire.git
cd spire
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
