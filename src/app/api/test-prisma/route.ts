import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, data, id } = body;

    if (operation === 'insert') {
      // Test insert using Prisma
      const result = await db.channel.create({
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category
        }
      });
      
      return NextResponse.json({
        success: true,
        operation: 'insert',
        result: result
      });
      
    } else if (operation === 'delete') {
      // Test delete using Prisma
      const result = await db.channel.delete({
        where: { id: id }
      });
      
      return NextResponse.json({
        success: true,
        operation: 'delete',
        result: result
      });
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid operation',
        details: `Operation '${operation}' is not supported`
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Prisma test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Prisma test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}