# OpenHive 🐝

A modern full-stack social media platform built with Next.js 15, featuring real-time interactions, media sharing, and a clean, responsive UI.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6c47ff?style=flat-square)
![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448c5?style=flat-square)
![Neon](https://img.shields.io/badge/Database-Neon-00e699?style=flat-square)

**[🚀 Live Demo]: open-hive-mu.vercel.app

---

## Features

- **Authentication** — Secure sign-up/sign-in via Clerk (OAuth + email)
- **Posts** — Create text, image, video, and article link posts
- **Social** — Follow/unfollow users, like, comment, and save posts
- **Profiles** — View posts, comments, likes, and saved content per user
- **Notifications** — Real-time activity feed for interactions
- **Dark Mode** — System-aware theme toggle
- **Responsive** — Fully optimized for mobile and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Neon (Serverless Postgres) + Prisma ORM |
| Media | Cloudinary |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/installation) (recommended)
- Neon database — [neon.tech](https://neon.tech)
- Clerk account — [clerk.com](https://clerk.com)
- Cloudinary account — [cloudinary.com](https://cloudinary.com)

### Installation

```bash
git clone https://github.com/yourusername/openhive.git
cd openhive
```

Install dependencies with your preferred package manager:

```bash
pnpm install   # recommended
npm install    # also works
yarn install   # also works
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# Neon Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Cloudinary (server-side)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Cloudinary (client-side)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

### Database Setup

```bash
pnpm prisma generate
pnpm prisma db push
```

### Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/                  # Next.js App Router pages
├── actions/              # Server actions
├── components/           # Reusable UI components
│   └── ui/               # shadcn/ui primitives
├── context/              # React context providers
├── lib/                  # Utility functions & Prisma client
├── prisma/               # Schema and migrations
└── public/               # Static assets
```

---

## Third-Party Setup

### Cloudinary — Upload Preset
1. Go to **Dashboard → Settings → Upload → Upload Presets**
2. Create a preset with **Signing Mode: Unsigned**
3. Copy the preset name into `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Neon — Database URL
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard
3. Paste it into `DATABASE_URL`

---

## Deployment

1. Push your repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

---

## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feat/your-feature`
3. Commit your changes — `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

---

## License

[MIT](LICENSE)
