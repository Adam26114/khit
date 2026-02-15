# AGENTS.md

This guide helps AI coding assistants work effectively in this repository.

## Project Overview

**Local Brand Khit** - A Next.js 14 e-commerce application for a Myanmar local menswear fashion brand. Built with TypeScript, Tailwind CSS, shadcn/ui, Convex (backend), and Better Auth.

- **Package Manager**: Bun (not npm/yarn/pnpm)
- **Framework**: Next.js 14.2.35 with App Router
- **Backend**: Convex (serverless real-time database)
- **Auth**: Better Auth with `@convex-dev/better-auth`
- **UI**: Radix UI primitives + shadcn/ui
- **i18n**: next-intl (English + Burmese)

## Build/Lint/Test Commands

```bash
# Development
bun dev                   # Start Next.js dev server
bunx convex dev          # Start Convex dev server (separate terminal)

# Build & Deploy
bun build                # Production build
bun start                # Start production server

# Code Quality
bun lint                 # Run ESLint (Next.js config)
bunx tsc --noEmit        # Type check without emitting files
```

**Testing**: No test framework is currently configured.

**Note**: Always use `bun` for package operations, not npm/yarn.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/            # Admin dashboard route group
│   │   └── (store)/            # Storefront route group
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── admin/              # Admin-specific components
│   │   └── store/              # Store-specific components
│   ├── hooks/                  # React hooks
│   ├── lib/                    # Utilities (cn, convex, storage)
│   ├── providers/              # React context providers
│   └── i18n/                   # Internationalization
├── convex/                     # Convex backend
│   ├── schema.ts               # Database schema
│   ├── auth/                   # Auth configuration
│   ├── categories.ts           # Categories mutations/queries
│   ├── orders.ts               # Orders mutations/queries
│   └── products.ts             # Products mutations/queries
└── public/                     # Static assets
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - Always type function parameters and return values
- Use `interface` for component props (allows extends)
- Use `type` for complex unions or mapped types
- Prefer explicit return types for public functions
- Use absolute imports with `@/` alias

### Import Ordering

```typescript
// 1. React  2. External libs  3. Internal utilities  4. Components  5. Styles
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import "./globals.css";
```

### Component Patterns

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Naming Conventions

- Components: PascalCase (e.g., `UserProfile`)
- Component files: kebab-case (e.g., `user-profile.tsx`)
- Hooks: use + PascalCase (e.g., `useToast`)
- Hook files: kebab-case (e.g., `use-toast.ts`)
- Utilities: camelCase (e.g., `cn`, `formatDate`)
- Props interfaces: `[Component]Props` (e.g., `ButtonProps`)
- Convex files: camelCase (e.g., `categories.ts`)

### Styling (Tailwind CSS)

- Always use `cn()` utility from `@/lib/utils` for class merging
- Follow shadcn/ui patterns using `class-variance-authority` for variants
- Use CSS variables from `globals.css` (HSL format)
- Semantic colors: `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`
- Pattern: `cn(baseClasses, variantClasses, className)`

### Error Handling

```typescript
// Validation with Zod
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Too short"),
});

type FormData = z.infer<typeof schema>;

// Async error handling
async function fetchData() {
  try {
    return await api.query();
  } catch (error) {
    if (error instanceof Error) {
      console.error("Fetch failed:", error.message);
    }
    throw error;
  }
}
```

### Form Handling

- Use `react-hook-form` with Zod resolver (`@hookform/resolvers/zod`)
- Wrap with shadcn/ui Form components (Form, FormField, FormItem, FormControl, FormMessage)

### Internationalization

- Uses `next-intl` for i18n routing and translations
- Messages stored in `src/i18n/messages/{en,my}.json`
- Use `useTranslations()` hook for all user-facing strings
- Never hardcode UI text - always use translation keys

### Database (Convex)

- Schema defined in `convex/schema.ts`
- Mutations/queries in `convex/*.ts` files
- Use generated types from `convex/_generated/api`
- Pattern: `useQuery(api.{file}.{function})`

### Environment Variables

- Development: `.env.local` (gitignored, never commit)
- Template: `.env.local.example`
- Common vars: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`

### Git Guidelines

- Never commit `.env.local` or sensitive credentials
- Never use `git commit --amend` on pushed commits
- Only commit when explicitly requested by user
- Write clear, descriptive commit messages

## Key Dependencies

- **UI**: `@radix-ui/*`, `class-variance-authority`, `tailwind-merge`
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod@4.x`
- **Auth**: `better-auth`, `@convex-dev/better-auth`
- **Database**: `convex`
- **i18n**: `next-intl`
- **Icons**: `lucide-react`, `@phosphor-icons/react`
- **Monitoring**: `@sentry/nextjs`

## Quick Reference

**Adding a shadcn/ui component**:
```bash
cd local-brand-khit && bunx shadcn@latest add button
```

**Using the cn() utility**:
```typescript
import { cn } from "@/lib/utils";
className={cn("base-classes", isActive && "active", className)}
```
