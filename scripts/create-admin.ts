import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

async function createAdminUser() {
  const email = 'admin@example.com';
  const password = 'admin123';
  
  try {
    // Check if admin user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });

    console.log('Admin user created successfully:', user.id);

    // Create default quota setting
    await db.setting.upsert({
      where: { key: 'api_quota_total' },
      update: { value: 10000 },
      create: { key: 'api_quota_total', value: 10000 },
    });

    console.log('Default quota setting created');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await db.$disconnect();
  }
}

createAdminUser();