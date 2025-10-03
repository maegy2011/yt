import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    console.log('POST /api/force-reset-database - Starting force reset...');
    
    // Test database connection
    await db.$connect();
    console.log('Database connected successfully');
    
    // Drop the table if it exists
    try {
      await db.$executeRawUnsafe('DROP TABLE IF EXISTS channels;');
      console.log('Table dropped successfully');
    } catch (dropError) {
      console.log('Error dropping table:', dropError);
    }
    
    // Create the table with the correct structure
    const createTableSQL = `
      CREATE TABLE channels (
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
    console.log('Table created successfully');
    
    // Test the table by inserting and deleting a record
    const testId = 'UCforce_reset_test_' + Date.now();
    await db.$executeRaw`
      INSERT INTO channels (id, name, description, category)
      VALUES (${testId}, ${'قناة اختبار إعادة التعيين'}, ${'قناة اختبار للتحقق من إعادة التعيين'}, ${'اختبار'})
    `;
    
    console.log('Test record inserted successfully');
    
    // Clean up
    await db.$executeRaw`DELETE FROM channels WHERE id = ${testId}`;
    console.log('Test record cleaned up');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database force reset completed successfully',
      details: {
        connection: 'OK',
        table: 'Created',
        test: 'Passed'
      }
    });
    
  } catch (error) {
    console.error('Force reset failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Force reset failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}