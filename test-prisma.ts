import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })
prisma.$connect().then(() => console.log('success')).catch(e => console.error(e))
