require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;

// Extract schema from the connection string (?schema=...) and pass it
// explicitly to PrismaPg — the adapter does not honour the query param itself.
const schemaMatch = connectionString?.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? schemaMatch[1] : "public";

const adapter = connectionString ? new PrismaPg({ connectionString }, { schema }) : null;
const prisma = adapter ? new PrismaClient({ adapter }) : null;

module.exports = { prisma };
