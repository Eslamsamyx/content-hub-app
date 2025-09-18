const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Test user created successfully:');
    console.log('Email:', user.email);
    console.log('Password: Test123!');
    console.log('Role:', user.role);
    console.log('ID:', user.id);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists with email: test@example.com');

      // Try to get the existing user
      const existingUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });

      if (existingUser) {
        console.log('Existing user details:');
        console.log('Email:', existingUser.email);
        console.log('Password: Test123! (if not changed)');
        console.log('Role:', existingUser.role);
      }
    } else {
      console.error('Error creating user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();