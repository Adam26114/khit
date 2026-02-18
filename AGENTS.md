# AGENTS.md

Assistant guide for this repository. Keep this file in sync with actual code behavior.

## Project Snapshot

**Local Brand Khit** is a Next.js + Convex e-commerce app with storefront and admin panel.

- Package manager: **Bun only**
- Frontend: Next.js 14 (App Router), Tailwind, shadcn/ui
- Backend: Convex
- Auth: Better Auth + `@convex-dev/better-auth`
- Validation: Zod
- Notifications: Sonner
- Icons: `@solar-icons/react` (storefront wrapper) + Lucide (admin/ui)

## Run Commands

```bash
# app
bun run dev

# convex (separate terminal)
bunx convex dev

# quality
bun run lint
bunx tsc --noEmit

# production
bun run build
bun run start
```

No automated test suite is configured yet.

## High-Level Structure

```text
src/
  app/
    (store)/...
    (admin)/admin/...
    api/auth/[...all]/route.ts
    api/storage/[id]/route.ts
  components/
    admin/
    store/
    ui/
    solar-icons.tsx
  lib/
    convex.ts
    image.ts
    notifications.ts
    product-variants.ts
    storage.ts
    zod-errors.ts
convex/
  schema.ts
  products.ts
  variants.ts
  media.ts
  colors.ts
  sizes.ts
  categories.ts
  orders.ts
  users.ts
```

## Current Data Model (Important)

Convex schema is variant-based:

- `products`
- `productVariants` (product + color + size)
- `colors`
- `sizes`
- `media` (linked to `variantId`)
- `cartItems` (linked to `variantId`)
- `wishlistItems` (linked to `variantId`)

Legacy fields still exist on `products` for compatibility (`price`, `images`, `sizes`, `colors`, `stock`).

## Variant Media Rules (Critical)

- Media upload in admin currently auto-links across all active variants with same `(productId, colorId)` when created from one variant.
- Product hydration (`convex/products.ts`) provides fallback chain:
  1. own variant media
  2. same-color sibling media
  3. first available media in product variants
  4. legacy product images
- Frontend image selection is centralized in `src/lib/product-variants.ts`.

When changing image behavior, update both:
- backend hydration (`convex/products.ts`)
- frontend selection utils (`src/lib/product-variants.ts`)

## Admin UI Conventions

- Shell/layout: `src/components/admin/layout-shell.tsx`, `src/components/admin/sidebar.tsx`, `src/components/admin/header.tsx`
- Sidebar mode: inset + icon collapse
- Theme: localStorage key `khit-admin-theme`
- Reusable table: `src/components/admin/data-table.tsx`
  - search
  - sort
  - column visibility
  - pagination + rows/page
  - row selection + bulk actions
  - row actions menu
  - empty state component

## Form + Validation Conventions

Use this pattern across admin pages:

- Zod schema per page
- `zodToFormErrors` from `src/lib/zod-errors.ts`
- Field wrappers from `src/components/ui/field`
- Keep field alignment stable by always rendering `FieldDescription` (use invisible placeholder when no error)
- Notify through `notify` helper from `src/lib/notifications.ts`

## Media Upload Conventions

- Reusable uploader: `src/components/admin/media-uploader.tsx`
- Image compression to WebP at upload (`compressImageToWebP`, target up to 1920x1080)
- Use `resolveImageSrc` for rendering storage IDs safely
- Storage proxy route: `/api/storage/[id]` -> `products:getStorageUrl`

## Environment Notes

Do not commit `.env.local`.

Important variables:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_SITE_URL` (or `CONVEX_SITE_URL`) for Better Auth helper
- `BETTER_AUTH_SECRET`
- `INITIAL_ADMIN_EMAIL` (comma-separated supported)

## Assistant Editing Rules (Repo-Specific)

1. Use `bun`, not npm/yarn/pnpm.
2. Prefer extending reusable components over page-local duplication:
   - `AdminDataTable`
   - `AdminMediaUploader`
   - `product-variants` utility
   - `notifications` helper
3. Keep docs updated when behavior changes:
   - `README.md`
   - `project-tasks/project-history.md`
   - `project-tasks/phase-3-admin-panel.md`
4. For Convex schema changes, account for existing data compatibility/migration.
5. For image-related fixes, validate end-to-end:
   - admin upload/association
   - product API payload
   - storefront render/swap/fallback
