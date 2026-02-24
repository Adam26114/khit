# KHIT E-Commerce Platform

Premium Myanmar fashion storefront and admin panel, built with **Next.js 14 + Convex + Better Auth + Bun**.

Last updated: **February 24, 2026**

## Overview

This repository powers:

- Customer-facing storefront (product browsing, cart, checkout, order confirmation)
- Customer account flows (login/register/profile/order history)
- Admin workspace (dashboard, product management, category management, order operations)
- Convex backend for catalog, orders, users, cart, and wishlist data

## Feature Snapshot

| Area | Implemented |
| --- | --- |
| Storefront | Homepage, category pages, product detail, cart drawer, checkout (COD), order confirmation |
| Authentication | Better Auth email/password login + register, session-aware routing |
| Customer Account | Profile editing, order history page |
| Admin Core | Dashboard, products CRUD, categories CRUD, orders status updates |
| Admin UI System | Sidebar shell, theme toggle (light/dark), reusable data table, zod validation, sonner notifications |
| Media Handling | Convex storage upload URL flow + `/api/storage/[id]` signed URL proxy |

## Route Map

### Storefront

- `/`
- `/[category]`
- `/products/[slug]`
- `/checkout`
- `/order-confirmation/[id]`
- `/login`
- `/register`
- `/account`
- `/account/orders`

### Admin

- `/admin`
- `/admin/products`
- `/admin/categories`
- `/admin/orders`

### Placeholder Pages

- `/admin/inventory`
- `/admin/users`
- `/admin/settings`

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui, Radix UI |
| Backend | Convex |
| Auth | Better Auth + `@convex-dev/better-auth` |
| Validation | Zod + React Hook Form |
| Monitoring | Sentry (`@sentry/nextjs`) |
| Runtime & Package Manager | Bun |

## Quick Start

### 1. Install dependencies

```bash
cd local-brand-khit
bun install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Generate a secure auth secret:

```bash
openssl rand -base64 32
```

### 3. Run backend and app

```bash
# Terminal 1
bunx convex dev

# Terminal 2
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (ex: `http://localhost:3000`) |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment identifier |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex URL used by client + server helpers |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing/encryption secret |
| `INITIAL_ADMIN_EMAIL` | Yes | Comma-separated email(s) granted admin role |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Optional | Better Auth Convex site URL helper |
| `CONVEX_SITE_URL` | Optional | Fallback for Convex site URL helper |
| `SENTRY_DSN` | Optional | Server/edge Sentry DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Client-side Sentry DSN |

See `.env.local.example` for starter values.

## Available Commands

| Command | Description |
| --- | --- |
| `bun run dev` | Start Next.js development server |
| `bun run build` | Build production app |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bunx convex dev` | Start Convex development runtime |
| `bunx tsc --noEmit` | Run TypeScript type checking |

## Data Model (Current)

Primary Convex tables in `convex/schema.ts`:

- `users`
- `categories`
- `products` (includes `colorVariants` for size/stock/image grouping)
- `cartItems`
- `wishlistItems`
- `orders`

Key backend modules:

- `convex/products.ts`
- `convex/categories.ts`
- `convex/orders.ts`
- `convex/users.ts`
- `convex/cart.ts`
- `convex/wishlist.ts`

## Project Structure

```text
local-brand-khit/
├── src/
│   ├── app/
│   │   ├── (store)/
│   │   ├── (admin)/admin/
│   │   └── api/
│   ├── components/
│   │   ├── admin/
│   │   ├── store/
│   │   └── ui/
│   ├── lib/
│   └── providers/
├── convex/
│   ├── schema.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── orders.ts
│   ├── users.ts
│   ├── cart.ts
│   └── wishlist.ts
└── project-tasks/
```

## Notes

- Use **Bun only** for dependency and script execution in this repository.
- Cart state is currently persisted in browser local storage (`khit-cart`).
- Product image uploads are compressed to WebP on the client, then uploaded via Convex.
- No automated test suite is configured yet.

## License

Private repository. All rights reserved.
