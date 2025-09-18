const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🚀 Creating test user...');

    const hashedPassword = await bcrypt.hash('Test123!@#', 12);

    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Test user created:', {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    });

    // Create another user with CREATIVE role
    const creativeUser = await prisma.user.create({
      data: {
        email: 'creative@example.com',
        password: hashedPassword,
        firstName: 'Creative',
        lastName: 'Designer',
        role: 'CREATIVE',
        creativeRole: 'DESIGNER_2D',
        isActive: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Creative user created:', {
      id: creativeUser.id,
      email: creativeUser.email,
      name: `${creativeUser.firstName} ${creativeUser.lastName}`,
      role: creativeUser.role,
      creativeRole: creativeUser.creativeRole,
    });

    console.log('\n📝 You can now login with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Test123!@#');
    console.log('\n   OR');
    console.log('\n   Email: creative@example.com');
    console.log('   Password: Test123!@#');

  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ User already exists with this email');
    } else {
      console.error('❌ Error creating user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();