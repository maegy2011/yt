import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check if database is connected by trying to query users table
    let databaseConnected = false;
    let tablesCreated = false;
    let adminExists = false;

    try {
      // Try to count users to check if table exists and database is connected
      const userCount = await db.user.count();
      databaseConnected = true;
      tablesCreated = true;
      
      // Check if admin user exists
      const adminUser = await db.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      adminExists = !!adminUser;
    } catch (error) {
      // If table doesn't exist, database might be connected but tables not created
      try {
        // Try a simple query to check database connection
        await db.$queryRaw`SELECT 1`;
        databaseConnected = true;
      } catch (connectionError) {
        databaseConnected = false;
      }
    }

    return NextResponse.json({
      databaseConnected,
      tablesCreated,
      adminExists,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}