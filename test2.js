const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

console.log("Creating adapter with url:", process.env.DATABASE_URL || "file:./dev.db");
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" })

const prisma = new PrismaClient({ adapter })

prisma.user.count().then(console.log).catch(console.error);
