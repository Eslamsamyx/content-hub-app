const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(email, password) {
  try {
    console.log(`\n🧪 Testing login for ${email}...`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found');
      return false;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      creativeRole: user.creativeRole,
      isActive: user.isActive,
    });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (isValidPassword) {
      console.log('✅ Password is correct');
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
      
      console.log('✅ Last login updated');
      return true;
    } else {
      console.log('❌ Invalid password');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during login test:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting authentication tests...');

  // Test admin login
  await testLogin('admin@example.com', 'Test123!@#');
  
  // Test creative login
  await testLogin('creative@example.com', 'Test123!@#');
  
  // Test with wrong password
  await testLogin('admin@example.com', 'wrongpassword');
  
  // Test with non-existent user
  await testLogin('nonexistent@example.com', 'Test123!@#');

  await prisma.$disconnect();
  console.log('\n✨ Tests completed!');
}

runTests();