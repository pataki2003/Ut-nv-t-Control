# Utánvét Control

Lean MVP scaffold for a future cash-on-delivery operations dashboard built with
Next.js App Router, TypeScript, and Tailwind CSS.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill it later when Supabase is added:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   or

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates the production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.
- `npm run lint:fix` runs ESLint with automatic fixes.

## Environment Variables

The scaffold includes placeholders only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase is not wired yet.

## Routes

- `/` redirects to `/login`
- `/login` placeholder authentication screen
- `/dashboard` dashboard overview shell
- `/shipments` shipment workspace placeholder
- `/returns` returns workspace placeholder
- `/import` import workspace placeholder

## Project Shape

- `app/` route tree and layouts
- `components/layout/` dashboard shell pieces
- `components/ui/` thin reusable UI primitives
- `lib/utils/response.ts` small API JSON helper
- `types/` shared API response types
- `proxy.ts` request interception stub for future protected routes

## Not Implemented Yet

- Authentication
- Supabase integration
- Business logic
- Real shipment, return, or import flows
- API routes and data persistence
