import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    console.log('Starting database setup...');
    
    // Test database connection
    await db.$connect();
    console.log('Database connected successfully');
    
    // Try to create the channels table if it doesn't exist
    try {
      // Check if table exists by trying to query it
      await db.channel.findFirst();
      console.log('Channels table already exists');
    } catch (error) {
      console.log('Channels table might not exist, attempting to create it...');
      
      // Create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS channels (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          thumbnail_url VARCHAR(500),
          category VARCHAR(50),
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await db.$executeRawUnsafe(createTableSQL);
      console.log('Channels table created successfully');
    }
    
    // Test by inserting a sample channel
    const testChannel = await db.channel.create({
      data: {
        id: 'UCsetup_test_12345',
        name: 'قناة اختبار الإعداد',
        description: 'قناة اختبار للتحقق من أن قاعدة البيانات تعمل',
        category: 'اختبار'
      }
    });
    
    console.log('Test channel created:', testChannel);
    
    // Clean up the test channel
    await db.channel.delete({
      where: { id: 'UCsetup_test_12345' }
    });
    
    console.log('Test channel cleaned up');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      details: {
        connection: 'OK',
        table: 'Created or already exists',
        test: 'Passed'
      }
    });
    
  } catch (error) {
    console.error('Database setup failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}