require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : null;
const prisma = adapter ? new PrismaClient({ adapter }) : null;

module.exports = { prisma };
