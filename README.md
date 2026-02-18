# Khit E-Commerce Platform

Premium menswear e-commerce platform for **Khit (Myanmar local fashion brand)** built with **Next.js 14**, **Convex**, **Better Auth**, **shadcn/ui**, and **Bun**.

## Current Status

**As of 2026-02-17**

- Phase 1 (storefront backend integration): complete
- Phase 2 (authentication + customer account): complete
- Phase 3 (admin panel): implemented with expanded catalog tooling
- Variant/media model migration: implemented (products + variants + colors + sizes + media)
- Variant image selection (frontend + backend fallback): implemented

## Core Features

### Storefront

- Homepage with hero, category blocks, featured products, skeleton loading, and empty state CTA
- Product listing by category with filtering and sorting
- Product detail page with:
  - Color + size selection
  - Variant-aware image gallery
  - Graceful fallback when selected variant has no media
- Cart and checkout (COD)
- Order confirmation
- Login / register / account / order history

### Admin Panel

Implemented pages:

- `/admin` dashboard stats
- `/admin/orders` order status management
- `/admin/products` CRUD + media upload
- `/admin/categories` CRUD
- `/admin/colors` CRUD
- `/admin/sizes` CRUD
- `/admin/variants` CRUD
- `/admin/media` CRUD + upload + variant association

Current placeholders:

- `/admin/inventory` (coming soon)
- `/admin/users` (coming soon)
- `/admin/settings` (coming soon)

Admin UI includes:

- Shadcn sidebar layout (`variant="inset"`, `collapsible="icon"`)
- Light/dark mode toggle
- Reusable `AdminDataTable` with search, sort, column visibility, pagination, row selection, bulk actions
- Sonner notifications + zod form validation patterns

## Variant/Media Model

Convex schema uses these core tables:

- `products`
- `productVariants`
- `colors`
- `sizes`
- `media`
- `cartItems`
- `wishlistItems`

### Image association behavior

- Media is linked to `variantId`
- On media create, upload is auto-linked to all active variants with same `(productId, colorId)` to cover all sizes for that color
- Product responses include variant media and fallback chain:
  - own variant media
  - same-color sibling variant media
  - first available product variant media
  - legacy product images

This supports color-based image switching while keeping fallback-safe behavior.

## Quick Start

### Prerequisites

- Bun
- Node.js 18+

### Install

```bash
cd local-brand-khit
bun install
cp .env.local.example .env.local
```

Generate auth secret:

```bash
openssl rand -base64 32
```

### Run Convex + Next.js

```bash
# terminal 1
bunx convex dev

# terminal 2
bun run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | App URL | Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment name/url | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL (for client + API route proxy) | Yes |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex site URL (Better Auth helper) | Recommended |
| `CONVEX_SITE_URL` | Fallback site URL for Better Auth helper | Optional |
| `BETTER_AUTH_SECRET` | Better Auth secret | Yes |
| `INITIAL_ADMIN_EMAIL` | Comma-separated emails auto-treated as admin | Yes |
| `SENTRY_DSN` | Sentry DSN | Optional |

## One-Time Migration (Legacy Products -> Variant Model)

If legacy products exist without variants:

```bash
# dry run
bunx convex run products:migrateLegacyProductsToVariantModel '{"dryRun": true}'

# apply
bunx convex run products:migrateLegacyProductsToVariantModel '{"dryRun": false}'
```

## Scripts

- `bun run dev` - Next.js dev server
- `bun run build` - Production build
- `bun run start` - Run production build
- `bun run lint` - ESLint
- `bunx tsc --noEmit` - Type check
- `bunx convex dev` - Convex dev runtime

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
│   └── lib/
├── convex/
│   ├── schema.ts
│   ├── products.ts
│   ├── variants.ts
│   ├── media.ts
│   ├── colors.ts
│   └── sizes.ts
└── project-tasks/
```

## Notes

- Use `bun` for all package commands in this repo.
- Image previews in admin uploader use client-side compression to WebP (target max 1920x1080).
- Storage IDs are resolved through `/api/storage/[id]` proxy route.

## License

Private - All rights reserved.
