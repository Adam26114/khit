# Khit E-Commerce Platform

A premium menswear e-commerce platform for Myanmar local brand **Khit**, built with Next.js 14+, Convex, Better Auth, and Sentry.

## Overview

- **Brand**: Khit - Premium Menswear from Myanmar
- **Location**: Yangon (Store Pickup: Weekdays 9am - 4pm)
- **Currency**: MMK (Myanmar Kyat)
- **Payment**: Cash on Delivery (COD)
- **Delivery**: Shipping (2,500 Ks) or Store Pickup (Free)

## 🚀 Quick Start

### Prerequisites
- Bun (package manager)
- Node.js 18+

### Installation

1. **Navigate to project:**
   ```bash
   cd local-brand-khit
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

4. **Generate Better Auth secret:**
   ```bash
   openssl rand -base64 32
   # Copy the output to BETTER_AUTH_SECRET in .env.local
   ```

5. **Initialize Convex:**
   ```bash
   bunx convex dev
   ```
   This will start the Convex dev server and provide you with a deployment URL.

6. **Update environment variables:**
   Add your Convex deployment URL to `.env.local`:
   ```
   CONVEX_DEPLOYMENT=your_convex_url_here
   NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
   ```

7. **Run the development server:**
   ```bash
   bun run dev
   ```

8. **Open [http://localhost:3000](http://localhost:3000)**

## 📋 Sentry Setup (Optional - Phase 0)

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for "khit-ecommerce"
3. Get your DSN from the project settings
4. Add to `.env.local`:
   ```
   SENTRY_DSN=your_dsn_here
   SENTRY_ORG=your_org_slug
   SENTRY_PROJECT=khit-ecommerce
   ```

## 📁 Project Structure

```
├── app/
│   ├── (store)/          # Customer-facing storefront
│   ├── (admin)/admin/    # Admin panel
│   └── api/auth/         # Better Auth API routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── store/            # Storefront components
│   └── admin/            # Admin components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── auth.ts           # Better Auth config
│   └── http.ts           # HTTP routes
├── i18n/                 # Internationalization
│   ├── messages/en.json  # English translations
│   └── messages/my.json  # Burmese translations
└── lib/                  # Utilities
```

## 🛠️ Technology Stack

- **Frontend:** Next.js 14+ (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **Backend:** Convex (real-time database)
- **Authentication:** Better Auth
- **Monitoring:** Sentry
- **Package Manager:** Bun
- **Deployment:** Vercel

## 📦 Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bunx convex dev` - Start Convex dev server

## 👤 Initial Admin

The first user to register with email `zweaungnaing26@gmail.com` will be automatically assigned the admin role.

## 📱 Default Categories

### Menswear
- **Clothing**: T-shirts, Shirts, Pants, Shorts, Jackets, Hoodies, Sweaters, Jeans
- **Shoes**: (To be configured in admin)
- **Accessories**: (To be configured in admin)

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment URL | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex public URL | Yes |
| `BETTER_AUTH_SECRET` | Better Auth secret key | Yes |
| `SENTRY_DSN` | Sentry DSN (optional) | No |
| `INITIAL_ADMIN_EMAIL` | Initial admin email | Yes |

## 🎯 Development Phases

### Phase 0 ✅ (Current)
- Project setup and configuration
- Database schema design
- Admin panel foundation
- Storefront foundation
- i18n setup (English + Burmese)

### Phase 1 (Coming Soon)
- Homepage with hero section
- Product listing pages
- Product detail pages
- Shopping cart
- Checkout with COD

### Phase 2 (Coming Soon)
- User authentication
- Customer accounts
- Order history
- Profile management

### Phase 3 (Coming Soon)
- Admin order management
- Product management
- Category management
- Inventory control

## 📄 License

Private - All rights reserved.
