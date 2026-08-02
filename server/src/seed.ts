import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

async function seed() {
  console.log('🌱 Seeding real database users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const usersData = [
    {
      username: 'selormwalker',
      email: 'juniorkwamewalker@gmail.com',
      phone: '+233 50 123 4567',
      name: 'David Selorm Walker',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      bio: 'Quantitative Systems Developer & AI Engineer'
    },
    {
      username: 'alexa_tech',
      email: 'alexa@pulse.chat',
      phone: '+1 415 889 1204',
      name: 'Alexa Vance',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      bio: 'Senior Full-Stack Architect @ Vercel'
    },
    {
      username: 'marcus_quant',
      email: 'marcus@trading.io',
      phone: '+44 20 7946 0912',
      name: 'Marcus Sterling',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      bio: 'HFT Trader & Low-latency C++ builder'
    },
    {
      username: 'elena_design',
      email: 'elena@studio.design',
      phone: '+49 30 1234 5678',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      bio: 'UI/UX Glassmorphism Enthusiast'
    }
  ];

  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (!existing) {
      await prisma.user.create({
        data: {
          ...u,
          password: passwordHash
        }
      });
      console.log(`✅ Created real user: ${u.username}`);
    }
  }

  // Create initial DM between Selorm & Alexa in real SQLite DB
  const selorm = await prisma.user.findUnique({ where: { username: 'selormwalker' } });
  const alexa = await prisma.user.findUnique({ where: { username: 'alexa_tech' } });

  if (selorm && alexa) {
    const existingDM = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: selorm.id } } },
          { members: { some: { userId: alexa.id } } }
        ]
      }
    });

    if (!existingDM) {
      const dm = await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [{ userId: selorm.id }, { userId: alexa.id }]
          }
        }
      });

      await prisma.message.create({
        data: {
          conversationId: dm.id,
          senderId: alexa.id,
          text: 'Hey David! The real Node.js Express REST API & WebSocket server with SQLite database is live!'
        }
      });
      console.log('✅ Created real DM & initial message in database.');
    }
  }

  console.log('🎉 Seeding completed!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
