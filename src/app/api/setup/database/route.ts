import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';

export async function POST() {
  try {
    // Check if tables already exist
    let tablesCreated = false;
    let adminExists = false;

    try {
      // Try to count users to check if table exists
      await db.user.count();
      tablesCreated = true;
      
      // Check if admin user exists
      const adminUser = await db.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      adminExists = !!adminUser;
    } catch (error) {
      // Tables don't exist, create them using Prisma push
      try {
        execSync('npx prisma db push', { stdio: 'pipe' });
        tablesCreated = true;
      } catch (pushError) {
        console.error('Prisma db push failed:', pushError);
        return NextResponse.json(
          { error: 'Failed to create database tables' },
          { status: 500 }
        );
      }
    }

    // Create default admin user if it doesn't exist
    if (!adminExists && tablesCreated) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      try {
        await db.user.create({
          data: {
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN',
          },
        });
        
        adminExists = true;
      } catch (createError) {
        console.error('Failed to create admin user:', createError);
        return NextResponse.json(
          { error: 'Failed to create admin user' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      status: {
        databaseConnected: true,
        tablesCreated,
        adminExists,
      },
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup database' },
      { status: 500 }
    );
  }
}