import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('GET /api/setup-database - Checking database status...');
    
    // Test database connection
    await db.$connect();
    console.log('Database connected successfully');
    
    // Check if table exists using raw SQL
    try {
      const tableCheck = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'channels'
        ) as exists;
      `;
      
      const tableExists = (tableCheck as any)[0].exists;
      
      if (tableExists) {
        console.log('Channels table exists');
        
        // Check if table has all required columns
        const requiredColumns = ['created_at', 'updated_at', 'added_at'];
        let missingColumns: string[] = [];
        
        for (const columnName of requiredColumns) {
          const columnCheck = await db.$queryRaw`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'channels' 
              AND column_name = ${columnName}
            ) as exists;
          `;
          
          const columnExists = (columnCheck as any)[0].exists;
          if (!columnExists) {
            missingColumns.push(columnName);
          }
        }
        
        if (missingColumns.length === 0) {
          return NextResponse.json({ 
            success: true, 
            message: 'Database is already set up',
            details: {
              connection: 'OK',
              table: 'Exists',
              columns: 'Complete',
              status: 'Ready'
            }
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            message: 'Database needs column updates',
            details: {
              connection: 'OK',
              table: 'Exists',
              missingColumns: missingColumns,
              status: 'Needs setup',
              suggestion: 'Send POST request to update database'
            }
          });
        }
      } else {
        console.log('Channels table does not exist');
        
        return NextResponse.json({ 
          success: false, 
          message: 'Database needs setup',
          details: {
            connection: 'OK',
            table: 'Missing',
            status: 'Needs setup',
            suggestion: 'Send POST request to setup database'
          }
        });
      }
      
    } catch (error) {
      console.log('Error checking table existence:', error);
      
      return NextResponse.json({ 
        success: false, 
        message: 'Database needs setup',
        details: {
          connection: 'OK',
          table: 'Unknown',
          status: 'Needs setup',
          suggestion: 'Send POST request to setup database'
        }
      });
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/setup-database - Starting database setup...');
    
    // Get the request body to check if we should reset the database
    const body = await request.json().catch(() => ({}));
    const { reset = false } = body;
    
    // Test database connection
    await db.$connect();
    console.log('Database connected successfully');
    
    // If reset is requested, drop the existing table
    if (reset) {
      try {
        console.log('Reset requested, dropping existing table...');
        await db.$executeRawUnsafe('DROP TABLE IF EXISTS channels;');
        console.log('Table dropped successfully');
      } catch (dropError) {
        console.log('Error dropping table (might not exist):', dropError);
      }
    }
    
    // Check if table exists and has the correct structure using raw SQL
    let tableExists = false;
    try {
      const tableCheck = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'channels'
        ) as exists;
      `;
      
      tableExists = (tableCheck as any)[0].exists;
      console.log('Table exists:', tableExists);
    } catch (error) {
      console.log('Error checking table existence:', error);
    }
    
    if (!tableExists) {
      console.log('Creating new table...');
      // Create the table using raw SQL
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
    } else {
      console.log('Table exists, checking structure...');
      
      // Check for missing columns
      const requiredColumns = [
        { name: 'created_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { name: 'updated_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { name: 'added_at', definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
      ];
      
      for (const column of requiredColumns) {
        try {
          // Check if column exists
          const columnCheck = await db.$queryRaw`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'channels' 
              AND column_name = ${column.name}
            ) as exists;
          `;
          
          const columnExists = (columnCheck as any)[0].exists;
          
          if (!columnExists) {
            console.log(`Adding column: ${column.name}`);
            const addColumnSQL = `ALTER TABLE channels ADD COLUMN ${column.name} ${column.definition};`;
            await db.$executeRawUnsafe(addColumnSQL);
            console.log(`Column ${column.name} added successfully`);
          } else {
            console.log(`Column ${column.name} already exists`);
          }
        } catch (columnError) {
          console.log(`Error checking/adding column ${column.name}:`, columnError);
        }
      }
    }
    
    // Test the table structure using raw SQL instead of Prisma
    try {
      console.log('Testing table structure...');
      
      // Insert a test record using raw SQL
      const testId = 'UCsetup_test_' + Date.now();
      await db.$executeRaw`
        INSERT INTO channels (id, name, description, category)
        VALUES (${testId}, ${'قناة اختبار الإعداد'}, ${'قناة اختبار للتحقق من أن قاعدة البيانات تعمل'}, ${'اختبار'})
      `;
      
      console.log('Test record inserted successfully');
      
      // Clean up the test record
      await db.$executeRaw`DELETE FROM channels WHERE id = ${testId}`;
      console.log('Test record cleaned up');
      
      return NextResponse.json({ 
        success: true, 
        message: reset ? 'Database reset and setup completed successfully' : 'Database setup completed successfully',
        details: {
          connection: 'OK',
          table: tableExists ? 'Updated' : 'Created',
          test: 'Passed',
          reset: reset
        }
      });
      
    } catch (testError) {
      console.error('Table structure test failed:', testError);
      
      return NextResponse.json({ 
        success: false, 
        error: 'Table structure test failed',
        details: testError instanceof Error ? testError.message : 'Unknown error',
        stack: testError instanceof Error ? testError.stack : undefined
      }, { status: 500 });
    }
    
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