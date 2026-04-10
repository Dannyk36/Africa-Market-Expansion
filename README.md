# Africa Market Expansion

Created by **Daniel Kitabire**.

Africa Market Expansion is a full-stack TypeScript app for exploring expansion opportunities across African markets. The project includes a React client, an Express/tRPC server, and Drizzle-based data access.

## Tech Stack

- React 19
- TypeScript
- Vite
- Express
- tRPC
- Drizzle ORM
- pnpm

## Project Structure

- `client/` frontend app
- `server/` backend app
- `shared/` shared constants and types
- `drizzle/` schema and migrations

## How To Start The App

Open PowerShell in the project root:

```powershell
cd "C:\Users\Owner\OneDrive - Arizona State University\Desktop\old phone\Africa"
```

Install dependencies:

```powershell
corepack pnpm install
```

Create a local env file:

```powershell
Copy-Item .env.example .env
```

Start the development server:

```powershell
corepack pnpm run dev:win
```

Then open:

```text
http://localhost:3000
```

If port `3000` is already in use, the server will try the next available port.

## Environment Variables

The app can start without every integration configured, but some features need environment variables in a root `.env` file.

Common variables used by this project:

```env
PORT=3000
DATABASE_URL=
JWT_SECRET=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=
OPENAI_API_KEY=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_APP_ID=
VITE_OAUTH_PORTAL_URL=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=
TRUSTED_DATA_REFRESH_MINUTES=60
```

## Database Setup

This project uses **MySQL** for persisted features.

Example `DATABASE_URL`:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/africa_market_expansion
```

Run migrations after `DATABASE_URL` is set:

```powershell
corepack pnpm run db:push
```

Without a database, the app can still start, but DB-backed features will not work.

DB-backed features include:

- saved API keys
- saved preferences
- AI chat history and memory
- trusted-source refresh persistence
- extracted events and adjusted ranking signals

## Available Scripts

- `corepack pnpm run dev:win` starts the app in PowerShell on Windows
- `corepack pnpm run check` runs TypeScript type checking
- `corepack pnpm run test` runs tests
- `corepack pnpm run build` creates a production build

## How To Use It

1. Start the app with `corepack pnpm run dev:win`.
2. Open the local URL shown in the terminal.
3. Browse the dashboard to review country rankings and market data.
4. Use the filters to search countries and narrow by region.
5. Select a country to inspect detailed analysis and comparison data.
6. Add your API keys and env config if you want AI, map, storage, or OAuth-backed features to work.

## Notes

- The development command in `package.json` uses Unix-style environment syntax, so Windows users should use `dev:win`.
- Database access is lazy, so the app can still boot without `DATABASE_URL`, but DB-backed features will not work until it is configured.
- `DATABASE_URL is required to run drizzle commands` is normal if you run `db:push` before setting up `.env`.
- `OAUTH_SERVER_URL is not configured` is normal unless you want the login flow to work locally.
- `TrustedData Initial refresh skipped: database not available` means the trusted-source scheduler started, but persistence is disabled until `DATABASE_URL` is configured.

## Author

Project created by **Daniel Kitabire**.
