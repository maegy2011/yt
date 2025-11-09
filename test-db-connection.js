import { PrismaClient } from '@prisma/client'

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = new PrismaClient();
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
    
    // Test disconnect
    await client.$disconnect();
    console.log('Database disconnected successfully');
    
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  }
  }
}

testDbConnection();