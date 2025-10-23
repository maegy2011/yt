import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default preferences template
  const defaultPreferences = {
    autoPlay: true,
    annotations: false,
    captions: true,
    quality: 'auto',
    volume: 100,
    disableTracking: true,
    blockAds: true,
    hideWatchHistory: false,
  };

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });