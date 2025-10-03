import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('GET /api/debug-database - Starting database debug...');
    
    const results: any = {
      connection: false,
      tableExists: false,
      columns: {},
      testRecord: null,
      prismaTest: null,
      errors: []
    };

    // Test 1: Database connection
    try {
      await db.$connect();
      results.connection = true;
      console.log('✅ Database connection successful');
    } catch (error) {
      results.errors.push(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Database connection failed:', error);
    }

    if (results.connection) {
      // Test 2: Check if table exists
      try {
        const tableCheck = await db.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'channels'
          ) as exists;
        `;
        
        results.tableExists = (tableCheck as any)[0].exists;
        console.log(`✅ Table exists: ${results.tableExists}`);
      } catch (error) {
        results.errors.push(`Table check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('❌ Table check failed:', error);
      }

      if (results.tableExists) {
        // Test 3: Check column structure
        try {
          const columnsQuery = await db.$queryRaw`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'channels'
            ORDER BY ordinal_position;
          `;
          
          const columns = columnsQuery as any[];
          columns.forEach(col => {
            results.columns[col.column_name] = {
              type: col.data_type,
              nullable: col.is_nullable,
              default: col.column_default
            };
          });
          console.log('✅ Column structure retrieved');
        } catch (error) {
          results.errors.push(`Column check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error('❌ Column check failed:', error);
        }

        // Test 4: Insert test record using raw SQL
        try {
          const testId = 'UCdebug_test_' + Date.now();
          await db.$executeRaw`
            INSERT INTO channels (id, name, description, category)
            VALUES (${testId}, ${'قناة اختبار التصحيح'}, ${'قناة اختبار للتصحيح'}, ${'تصحيح'})
          `;
          
          // Retrieve the test record
          const testRecord = await db.$queryRaw`
            SELECT * FROM channels WHERE id = ${testId}
          `;
          
          results.testRecord = (testRecord as any)[0];
          
          // Clean up
          await db.$executeRaw`DELETE FROM channels WHERE id = ${testId}`;
          
          console.log('✅ Raw SQL test successful');
        } catch (error) {
          results.errors.push(`Raw SQL test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error('❌ Raw SQL test failed:', error);
        }

        // Test 5: Try Prisma operations
        try {
          const prismaTestId = 'UCprisma_test_' + Date.now();
          const prismaChannel = await db.channel.create({
            data: {
              id: prismaTestId,
              name: 'Prisma Test Channel',
              description: 'Testing Prisma operations',
              category: 'test'
            }
          });
          
          results.prismaTest = {
            create: true,
            created: prismaChannel
          };
          
          // Clean up
          await db.channel.delete({
            where: { id: prismaTestId }
          });
          
          results.prismaTest.delete = true;
          console.log('✅ Prisma test successful');
        } catch (error) {
          results.errors.push(`Prisma test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error('❌ Prisma test failed:', error);
        }
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      summary: {
        connection: results.connection ? '✅ OK' : '❌ Failed',
        table: results.tableExists ? '✅ Exists' : '❌ Missing',
        columns: Object.keys(results.columns).length > 0 ? '✅ Found' : '❌ Missing',
        rawSql: results.testRecord ? '✅ Working' : '❌ Failed',
        prisma: results.prismaTest?.create ? '✅ Working' : '❌ Failed',
        errors: results.errors.length
      }
    });

  } catch (error) {
    console.error('Debug failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}