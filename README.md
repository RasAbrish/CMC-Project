# CMS Content Management System

A high-fidelity, premium CMS built with Next.js, Better Auth, Prisma, and Tailwind CSS.

## Features

- **🛡️ Secure Authentication**: Powered by Better Auth with Role-Based Access Control (RBAC).
- **📊 Interactive Dashboard**: Real-time stats and content activity tracking.
- **✍️ Advanced WYSIWYG Editor**: TipTap-based editor with rich formatting, images, and links.
- **🖼️ Media Library**: Local file uploads with asset management and URL sharing.
- **📑 Full CRUD Content**: Manage Posts, Pages, Categories, and Tags.
- **🔗 Structural Management**: Dynamic Menus and Promotional Banners.
- **🌑 Premium UI**: Smooth dark theme with glassmorphism and animations.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM (v7)
- **Auth**: Better Auth
- **Validation**: Zod
- **State**: Zustand & TanStack Query
- **Editor**: TipTap
- **Styling**: Vanilla CSS (Premium Custom Design) & Tailwind

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   Ensure you have a PostgreSQL database running and update `.env` with your `DATABASE_URL`.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Design Principles

The application follows a "Premium Dark" aesthetic, using:
- **Glassmorphism**: Translucent cards with background blurs.
- **Vibrant Accents**: Gradient primary colors (#6366f1 to #c084fc).
- **Responsive Layout**: Collapsible sidebar and mobile-optimized interfaces.
- **Micro-animations**: Smooth transitions using CSS animations and Framer-like effects.
