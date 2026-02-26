# CMC (Content Management Core)

A modern, high-performance headless Content Management System built on Next.js 15+ and React 19.

## Features

- **Robust Dashboard**: Admin panel for managing resources securely.
- **Content Management**: Full CRUD capabilities for Posts, Pages, Categories, and Tags.
- **Media Library**: Seamless integration with Cloudinary for image and video uploads.
- **Authentication**: Built with Better Auth for secure, customizable credential and OAuth flows.
- **Roles & Permissions**: Role-based access control protecting critical routes and API endpoints.
- **Dynamic Routing**: Server-rendered dynamic routes for robust SEO and speed.
- **Database Architecture**: Prisma ORM with PostgreSQL, ready for serverless edge deployments.
- **Rich Text Editor**: Tiptap-based visual editor integrating seamlessly with the content models.

## Tech Stack

### Core
- **Framework**: Next.js (App Router, Server Components, Turbopack)
- **UI Library**: React

### Styling
- **CSS Framework**: Tailwind CSS
- **Component Primitives**: Radix UI (accessible components)
- **Icons**: Lucide React

### Backend & Database
- **Database**: PostgreSQL
- **ORM**: Prisma (with standard and serverless pg adapters)
- **Authentication**: Better Auth
- **Media Storage**: Cloudinary

### State & Validation
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Form Handling**: React Hook Form
- **Schema Validation**: Zod

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (e.g., Neon or local pg server)
- Cloudinary Account (for media uploads)

### Setup

1. **Clone the repository and install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Duplicate `.env.example` to `.env` (or create one) and configure the following:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/cms_db?schema=public"
   
   # Authentication
   BETTER_AUTH_SECRET="your-secure-random-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   
   # Media Management
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"

   # SMTP Setup for Email Verification / Password Resets
   SMTP_USER="your-email@example.com"
   SMTP_PASS="your-app-password"
   
   # Default Admin Seeding
   ADMIN_EMAIL="admin@admin.com"
   ADMIN_PASSWORD="securepassword"
   ```

3. **Initialize the Database**
   Run the database migrations and seed the default admin account:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can access the unified dashboard at `/login` using the default admin credentials you configured.

## Project Structure

- `src/app`: Next.js App Router holding the front-end, API routes, and dashboard interface.
- `src/components`: Reusable UI components including foundational elements and the Rich Text Editor.
- `src/lib`: Core configuration and utility functions (Prisma client, Better Auth configuration, generic validations, notification logic).
- `prisma`: Database schema and seed configuration.

## Production Deployment

This project is optimized for deployment on Vercel or similar platforms. 

1. Push your code to your repository.
2. Link your repository to your hosting platform.
3. Add the production connection strings (and other properties) to your Environment Variables setting.
4. The application is configured to automatically run `npx prisma migrate deploy && npx prisma db seed` during the standard build step to ensure secure and seamless database syncs on every deploy.

## License

MIT License.
