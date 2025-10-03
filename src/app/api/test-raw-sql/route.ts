import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, data, id } = body;

    if (operation === 'insert') {
      // Test insert using raw SQL
      const result = await db.$executeRaw`
        INSERT INTO channels (id, name, description, category)
        VALUES (${data.id}, ${data.name}, ${data.description}, ${data.category})
      `;
      
      // Verify the insert
      const inserted = await db.$queryRaw`
        SELECT * FROM channels WHERE id = ${data.id}
      `;
      
      return NextResponse.json({
        success: true,
        operation: 'insert',
        result: { insertResult: result, insertedData: inserted }
      });
      
    } else if (operation === 'delete') {
      // Test delete using raw SQL
      const result = await db.$executeRaw`
        DELETE FROM channels WHERE id = ${id}
      `;
      
      return NextResponse.json({
        success: true,
        operation: 'delete',
        result: { deleteResult: result }
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid operation',
        details: `Operation '${operation}' is not supported`
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Raw SQL test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Raw SQL test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}