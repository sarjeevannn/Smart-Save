# Micro Ledger 💰

Micro Ledger is a smart, mobile-first financial dashboard built specifically for micro-entrepreneurs and small business owners. It provides a simple but powerful interface to track sales, monitor expenses, manage customer credit/debt, and generate digital invoices.

## ✨ Features

- 📊 **Cash Flow Dashboard**: Visual tracking of income vs. expenses with interactive charts.
- 👥 **Smart Credit Ledger**: Track which customers owe you money and seamlessly send WhatsApp reminders for overdue payments.
- 🧾 **Digital Invoicing**: Generate professional invoices with automated scan-to-pay UPI QR codes.
- 🧠 **AI Financial Insights**: Automatic analysis of your business health, warning you about expense leakages, cash flow shortages, and identifying savings opportunities.
- 📱 **Mobile-First Experience**: A responsive design with bottom navigation and a beautiful dark-mode glassmorphism UI.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Framer Motion
- **Database**: SQLite (Local) with Prisma ORM
- **Authentication**: NextAuth.js (Credentials Provider)
- **Charts**: Recharts

## 🚀 Getting Started Locally

Follow these steps to run the project on your local machine:

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup the Database
We use Prisma with a local SQLite database. Push the schema to generate the `.db` file and Prisma Client:
```bash
npx prisma db push
npx prisma generate
```

### 3. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ☁️ Deployment

**Important Note regarding SQLite & Vercel**: 
Because this project uses a local SQLite database (`dev.db`), if you deploy directly to Vercel/Netlify, your data will reset every time the server goes to sleep (as serverless functions do not have persistent storage).

To deploy permanently to Vercel:
1. Create a free Postgres database on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
2. Change the provider in `prisma/schema.prisma` from `"sqlite"` to `"postgresql"`.
3. Add your `DATABASE_URL` to Vercel's Environment Variables.
4. Deploy!

## 📝 License
MIT License
