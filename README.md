# 🚀 LaunchDir — Startup Launch Directory

A modern, full-stack startup launch directory inspired by Product Hunt and Indie Hackers. Built with Next.js 14 App Router, TypeScript, Supabase, Prisma, and NextAuth.

---

## ✨ Features

- **Landing Page** — Hero, featured startups, latest launches, categories, newsletter
- **Product Directory** — Search, filter by category, sort by newest/popular/featured, pagination
- **Product Detail Pages** — Full descriptions, links, maker info, related products
- **Submit Products** — Form with validation, pending review workflow
- **Authentication** — Email/password sign up & login via NextAuth/Auth.js
- **User Dashboard** — View submitted products, upvote counts, status tracking
- **Admin Panel** — Approve/reject submissions, feature products, delete, stats
- **Upvoting** — Authenticated users can upvote products
- **Newsletter** — Email subscription with Supabase storage
- **Dark/Light Mode** — System-aware with manual toggle
- **SEO Optimized** — Dynamic metadata, sitemap, robots.txt, Open Graph
- **Fully Responsive** — Mobile-first design

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth v5 (Auth.js) |
| UI Components | Radix UI primitives |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Deployment | Vercel |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourname/startup-launch-directory.git
cd startup-launch-directory
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase (get from supabase.com → project → settings → database)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# NextAuth (generate secret: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# Supabase (get from supabase.com → project → settings → API)
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
# Push schema to Supabase
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Credentials

After seeding, use these to log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@launchdirectory.io | admin123 |
| User | john@example.com | password123 |
| User | sarah@example.com | password123 |

---

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (pages)/
│   │   ├── page.tsx          # Home
│   │   ├── products/
│   │   │   ├── page.tsx      # Product listing
│   │   │   └── [slug]/       # Product detail
│   │   ├── submit/           # Submit form
│   │   ├── dashboard/        # User dashboard
│   │   ├── admin/            # Admin panel
│   │   ├── login/            # Login
│   │   └── register/         # Registration
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth handlers + register
│   │   ├── products/         # Product CRUD + upvotes
│   │   ├── categories/       # Categories list
│   │   ├── admin/            # Admin actions
│   │   └── newsletter/       # Newsletter subscribe
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── layout/               # Navbar, Footer
│   ├── products/             # ProductCard, SearchBar, CategoryFilter, Newsletter
│   ├── admin/                # AdminStats, AdminProductTable, AdminTabs
│   └── ui/                   # Button, Input, Card, Badge, etc.
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # Prisma client
│   ├── supabase.ts           # Supabase client
│   ├── utils.ts              # Utilities
│   └── types.ts              # TypeScript types
├── types/
│   └── next-auth.d.ts        # Auth type extensions
└── middleware.ts             # Route protection
prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Seed script
```

---

## 🗄 Database Schema

- **users** — Accounts with roles (USER / ADMIN)
- **accounts / sessions** — NextAuth adapter tables
- **products** — Submitted products with status (PENDING / APPROVED / REJECTED)
- **categories** — Product categories with icons
- **upvotes** — User upvotes on products (unique per user+product)
- **newsletter_subscribers** — Email subscribers

---

## 🚢 Deploying to Vercel

1. Push your code to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy!

For the database, set `NEXTAUTH_URL` to your Vercel production URL.

---

## 📝 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push Prisma schema to DB
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

MIT
