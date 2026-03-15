import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

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

  const usersData = [
    { name: 'Elena Rostova', email: 'elena.r@rudratek.co.in', role: 'ADMIN' },
    { name: 'Dr. Marcus Vance', email: 'm.vance@rudratek.co.in', role: 'MEMBER' },
    { name: 'Cipher Node 4', email: 'cipher4@rudratek.co.in', role: 'MEMBER' },
    { name: 'Sarah Connor', email: 's.connor@rudratek.co.in', role: 'ADMIN' },
    { name: 'Neo Anderson', email: 'neo@rudratek.co.in', role: 'MEMBER' }
  ]

  const createdUsers = await Promise.all(
    usersData.map((u) => prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role as any,
        passwordHash,
        organizationId: org.id
      }
    }))
  )
  
  const allUsers = [owner, ...createdUsers]

  console.log('Seeding Projects...')
  const projectsData = [
    { name: 'Core System Engine', description: 'The main backend monolith orchestrating global operations and security compliance.' },
    { name: 'Telemetry Daemon', description: 'Real-time node status pinging and data ingestion pipeline.' },
    { name: 'Frontend Matrix UI', description: 'Glassmorphism dark theme interface for operative dash.' },
    { name: 'Gateway Auth Module', description: 'Zero-trust tenant isolation gateway.' }
  ]
  
  const createdProjects = await Promise.all(
    projectsData.map(p => prisma.project.create({
      data: { ...p, organizationId: org.id }
    }))
  )

  console.log('Seeding Classifications (Tags)...')
  const tagsData = [
    { name: 'SECURITY', color: '#ef4444' }, // red
    { name: 'BACKEND', color: '#8b5cf6' },  // purple
    { name: 'FRONTEND', color: '#3b82f6' }, // blue
    { name: 'HARDWARE', color: '#f59e0b' }, // amber
    { name: 'DATABASE', color: '#10b981' }, // emerald
    { name: 'NETWORK', color: '#0ea5e9' },  // sky
    { name: 'CRITICAL', color: '#ec4899' }, // pink
  ]
  
  const createdTags = await Promise.all(
    tagsData.map(t => prisma.tag.create({
      data: { ...t, organizationId: org.id }
    }))
  )

  console.log('Seeding Initial Anomaly Logs (Issues)...')
  
  const issuesList = [
    {
      title: 'Unauthorized access attempt detected on port 443',
      description: 'System kernel logged repeated connection requests from blacklisted IP range. Recommend immediate firewall rule updates and active monitoring of the gateway node.',
      status: 'OPEN',
      priority: 'CRITICAL',
      projectId: createdProjects[0].id,
      assignedToId: owner.id,
      tags: [createdTags[0].id, createdTags[6].id]
    },
    {
      title: 'Memory leak in real-time telemetry processing',
      description: 'Heap usage spikes linearly during high-throughput event transmission. Restarting the worker node temporarily resolves the issue. Need to profile the event loop.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: createdProjects[1].id,
      assignedToId: createdUsers[1].id,
      tags: [createdTags[1].id]
    },
    {
      title: 'UI glitch on mobile view layout',
      description: 'The sidebar overlaps with the main content area gracefully degrading navigation. Happens on viewports < 768px.',
      status: 'OPEN',
      priority: 'MEDIUM',
      projectId: createdProjects[2].id,
      assignedToId: createdUsers[0].id,
      tags: [createdTags[2].id]
    },
    {
      title: 'Database connection dropping intermittenly',
      description: 'Postgres instances are dropping the connection pool under heavy load. Needs SSL configurations enforced on pg adapter.',
      status: 'DONE',
      priority: 'HIGH',
      projectId: createdProjects[0].id,
      assignedToId: owner.id,
      tags: [createdTags[4].id, createdTags[1].id]
    },
    {
      title: 'Implement JWT refresh token rotation',
      description: 'Tokens are currently purely stateless and expiring in 7 days. Need a rotation mechanism via httponly cookies to maintain aggressive short-lived TTLs.',
      status: 'IN_REVIEW',
      priority: 'MEDIUM',
      projectId: createdProjects[3].id,
      assignedToId: createdUsers[2].id,
      tags: [createdTags[0].id]
    },
    {
      title: 'Hardware cluster node 3 offline',
      description: 'The physical hardware running the ingestion pipeline node 3 is completely unresponsive to SSH probes. Physical intervention might be required.',
      status: 'CRITICAL',
      priority: 'CRITICAL',
      projectId: createdProjects[1].id,
      assignedToId: createdUsers[3].id,
      tags: [createdTags[3].id, createdTags[5].id]
    },
    {
      title: 'Update React to v19 in strict mode',
      description: 'Next.js 16 leverages React 19 heavily. Some legacy hooks might throw warnings. Please audit the main branch.',
      status: 'OPEN',
      priority: 'LOW',
      projectId: createdProjects[2].id,
      assignedToId: null,
      tags: [createdTags[2].id]
    },
    {
      title: 'Rate limiter blocking valid Webhook origins',
      description: 'The API gateway rate limiter is too aggressive and blocking our internal Stripe webhook events. Whitelist the internal IP blocks.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: createdProjects[3].id,
      assignedToId: createdUsers[4].id,
      tags: [createdTags[5].id]
    }
  ]

  for (const item of issuesList) {
    // Pick random reporter
    const reporterId = allUsers[Math.floor(Math.random() * allUsers.length)].id;
    
    // Status enum normalization ('CRITICAL' status isn't valid, mapping to OPEN)
    const validStatus = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CLOSED'].includes(item.status) ? item.status : 'OPEN';

    const issue = await prisma.issue.create({
      data: {
        title: item.title,
        description: item.description,
        status: validStatus as any,
        priority: item.priority as any,
        organizationId: org.id,
        projectId: item.projectId,
        createdById: reporterId,
        assignedToId: item.assignedToId,
        tags: {
          create: item.tags.map(tagId => ({ tagId }))
        }
      }
    });

    // Seed 1-3 random comments per issue
    const numComments = Math.floor(Math.random() * 3) + 1;
    for (let c = 0; c < numComments; c++) {
      const commentAuthorId = allUsers[Math.floor(Math.random() * allUsers.length)].id;
      const bodies = [
        "I'm looking into this right now.",
        "Can we get priority bumped on this?",
        "Logs indicate a deeper core kernel panic. I'll dump the stack trace.",
        "Deployed a hotfix to staging, please verify.",
        "Acknowledged. Initiating diagnostic override.",
        "Wait, is this somehow related to the gateway node failing yesterday?",
        "Will sync with the infra team securely to identify the bottleneck."
      ];
      const commentBody = bodies[Math.floor(Math.random() * bodies.length)];

      await prisma.comment.create({
        data: {
          body: commentBody,
          issueId: issue.id,
          authorId: commentAuthorId,
          organizationId: org.id
        }
      });
    }
  }

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
