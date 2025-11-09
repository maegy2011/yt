const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  try {
    const client = new PrismaClient();
    console.log('Testing database connection...');
    
    // Test basic connection
    await client.$connect();
    console.log('Database connected successfully');
    
    // Test simple query
    const count = await client.favoriteVideo.count();
    console.log('Favorite videos count:', count);
    
    // Test findMany
    const favorites = await client.favoriteVideo.findMany({
      orderBy: { addedAt: 'desc' }
    });
    console.log('Found favorites:', favorites.length);
    
    await client.$disconnect();
    console.log('Database test completed successfully');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();