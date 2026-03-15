import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Clearing database...')
  await prisma.issueTag.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  console.log('Seeding Demo Organization...')
  const org = await prisma.organization.create({
    data: {
      name: 'Rudratek Global',
      slug: 'rudratek-hq'
    }
  })

  console.log('Seeding Users...')
  const passwordHash = await bcrypt.hash('root', 12)
  
  const owner = await prisma.user.create({
    data: {
      email: 'admin@rudratek.co.in',
      name: 'System Administrator',
      role: 'OWNER',
      passwordHash,
      organizationId: org.id
    }
  })

  console.log('Seeding Projects node...')
  const project = await prisma.project.create({
    data: {
      name: 'Core System Engine',
      description: 'The main backend monolith orchestrating global operations and security compliance.',
      organizationId: org.id
    }
  })

  console.log('Seeding Classifications (Tags)...')
  const tagsData = [
    { name: 'SECURITY', color: '#ef4444' }, // red
    { name: 'BACKEND', color: '#8b5cf6' },  // purple
    { name: 'FRONTEND', color: '#3b82f6' }, // blue
    { name: 'HARDWARE', color: '#f59e0b' }, // amber
  ]
  
  const createdTags = await Promise.all(
    tagsData.map(t => prisma.tag.create({
      data: { ...t, organizationId: org.id }
    }))
  )

  console.log('Seeding Initial Anomaly Logs (Issues)...')
  await prisma.issue.create({
    data: {
      title: 'Unauthorized access attempt detected on port 443',
      description: 'System kernel logged repeated connection requests from blacklisted IP range. Recommend immediate firewall rule updates and active monitoring of the gateway node.',
      status: 'OPEN',
      priority: 'CRITICAL',
      organizationId: org.id,
      projectId: project.id,
      createdById: owner.id,
      assignedToId: owner.id,
      tags: {
        create: [
          { tagId: createdTags[0].id }, // SECURITY
          { tagId: createdTags[1].id }  // BACKEND
        ]
      }
    }
  })

  await prisma.issue.create({
    data: {
      title: 'Memory leak in real-time telemetry processing',
      description: 'Heap usage spikes linearly during high-throughput event transmission. Restarting the worker node temporarily resolves the issue. Need to profile the event loop.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      organizationId: org.id,
      projectId: project.id,
      createdById: owner.id,
      tags: {
        create: [
          { tagId: createdTags[1].id } // BACKEND
        ]
      }
    }
  })

  console.log('Database successfully seeded with initializing data.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
