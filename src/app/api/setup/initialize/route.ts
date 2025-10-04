import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { adminEmail, adminPassword } = await request.json();

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin email and password are required' },
        { status: 400 }
      );
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if admin user already exists
    const existingAdmin = await db.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = await db.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN'
      }
    });

    // Log the setup action
    await db.auditLog.create({
      data: {
        action: 'SETUP_COMPLETE',
        targetType: 'SYSTEM',
        targetId: 'setup',
        details: {
          adminEmail,
          adminUserId: adminUser.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'System setup completed successfully'
    });
  } catch (error) {
    console.error('Setup initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize system setup' },
      { status: 500 }
    );
  }
}