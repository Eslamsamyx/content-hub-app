import { PrismaClient, UserRole, CreativeRole, TagCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Clearing existing test data...')
  await prisma.searchHistory.deleteMany()
  await prisma.notificationPreferences.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.shareLink.deleteMany()
  await prisma.externalLink.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.review.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.download.deleteMany()
  // await prisma.assetTag.deleteMany()
  // await prisma.collectionAsset.deleteMany()
  await prisma.assetVariant.deleteMany()
  await prisma.assetMetadata.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Create test users with different roles
  const password = await bcrypt.hash('Test@123', 10)

  // 1. Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@contenthub.com',
      firstName: 'Admin',
      lastName: 'User',
      password,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      bio: 'System Administrator with full access to all features',
      location: 'New York, USA',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/admin',
        twitter: 'https://twitter.com/admin'
      }
    }
  })
  console.log(`✅ Created Admin: admin@contenthub.com`)

  // 2. Content Manager
  const contentManager = await prisma.user.create({
    data: {
      email: 'manager@contenthub.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      password,
      role: UserRole.CONTENT_MANAGER,
      emailVerified: new Date(),
      bio: 'Content Manager responsible for asset curation and organization',
      location: 'Los Angeles, USA'
    }
  })
  console.log(`✅ Created Content Manager: manager@contenthub.com`)

  // 3. Creative Users (different creative roles)
  const photographer = await prisma.user.create({
    data: {
      email: 'photographer@contenthub.com',
      firstName: 'Alex',
      lastName: 'Chen',
      password,
      role: UserRole.CREATIVE,
      creativeRole: CreativeRole.PHOTOGRAPHER,
      emailVerified: new Date(),
      bio: 'Professional photographer specializing in product and lifestyle photography',
      location: 'San Francisco, USA',
      socialLinks: {
        portfolio: 'https://alexchen.photography',
        instagram: 'https://instagram.com/alexchen'
      }
    }
  })
  console.log(`✅ Created Photographer: photographer@contenthub.com`)

  const designer = await prisma.user.create({
    data: {
      email: 'designer@contenthub.com',
      firstName: 'Emily',
      lastName: 'Davis',
      password,
      role: UserRole.CREATIVE,
      creativeRole: CreativeRole.DESIGNER_2D,
      emailVerified: new Date(),
      bio: 'UI/UX Designer with expertise in brand identity and digital design',
      location: 'Austin, USA'
    }
  })
  console.log(`✅ Created Designer: designer@contenthub.com`)

  const videographer = await prisma.user.create({
    data: {
      email: 'videographer@contenthub.com',
      firstName: 'Michael',
      lastName: 'Brown',
      password,
      role: UserRole.CREATIVE,
      creativeRole: CreativeRole.VIDEO_EDITOR,
      emailVerified: new Date(),
      bio: 'Video producer and editor creating compelling visual stories',
      location: 'Miami, USA'
    }
  })
  console.log(`✅ Created Videographer: videographer@contenthub.com`)

  const modelArtist = await prisma.user.create({
    data: {
      email: '3dartist@contenthub.com',
      firstName: 'Lisa',
      lastName: 'Wong',
      password,
      role: UserRole.CREATIVE,
      creativeRole: CreativeRole.DESIGNER_3D,
      emailVerified: new Date(),
      bio: '3D artist specializing in product visualization and architectural renders',
      location: 'Seattle, USA'
    }
  })
  console.log(`✅ Created 3D Artist: 3dartist@contenthub.com`)

  // 4. Reviewer
  const reviewer = await prisma.user.create({
    data: {
      email: 'reviewer@contenthub.com',
      firstName: 'James',
      lastName: 'Wilson',
      password,
      role: UserRole.REVIEWER,
      emailVerified: new Date(),
      bio: 'Quality assurance specialist reviewing content for brand compliance',
      location: 'Chicago, USA'
    }
  })
  console.log(`✅ Created Reviewer: reviewer@contenthub.com`)

  // 5. Regular Users
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@contenthub.com',
      firstName: 'John',
      lastName: 'Doe',
      password,
      role: UserRole.USER,
      emailVerified: new Date(),
      bio: 'Marketing team member',
      location: 'Boston, USA'
    }
  })
  console.log(`✅ Created User: john.doe@contenthub.com`)

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@contenthub.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password,
      role: UserRole.USER,
      emailVerified: new Date(),
      bio: 'Sales team member',
      location: 'Denver, USA'
    }
  })
  console.log(`✅ Created User: jane.smith@contenthub.com`)

  // 6. Unverified User (for testing email verification)
  const unverifiedUser = await prisma.user.create({
    data: {
      email: 'unverified@contenthub.com',
      firstName: 'Test',
      lastName: 'Unverified',
      password,
      role: UserRole.USER,
      emailVerified: null,
      bio: 'Account pending email verification'
    }
  })
  console.log(`✅ Created Unverified User: unverified@contenthub.com`)

  // 7. Inactive User (for testing account status)
  const inactiveUser = await prisma.user.create({
    data: {
      email: 'inactive@contenthub.com',
      firstName: 'Inactive',
      lastName: 'Account',
      password,
      role: UserRole.USER,
      emailVerified: new Date(),
      isActive: false,
      bio: 'This account has been deactivated'
    }
  })
  console.log(`✅ Created Inactive User: inactive@contenthub.com`)

  // Create sample tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'product', slug: 'product', category: TagCategory.ASSET_TYPE } }),
    prisma.tag.create({ data: { name: 'lifestyle', slug: 'lifestyle', category: TagCategory.STYLE } }),
    prisma.tag.create({ data: { name: 'modern', slug: 'modern', category: TagCategory.STYLE } }),
    prisma.tag.create({ data: { name: 'vintage', slug: 'vintage', category: TagCategory.STYLE } }),
    prisma.tag.create({ data: { name: 'blue', slug: 'blue', category: TagCategory.COLOR } }),
    prisma.tag.create({ data: { name: 'red', slug: 'red', category: TagCategory.COLOR } }),
    prisma.tag.create({ data: { name: 'professional', slug: 'professional', category: TagCategory.THEME } }),
    prisma.tag.create({ data: { name: 'casual', slug: 'casual', category: TagCategory.THEME } }),
    prisma.tag.create({ data: { name: 'energetic', slug: 'energetic', category: TagCategory.MOOD } }),
    prisma.tag.create({ data: { name: 'calm', slug: 'calm', category: TagCategory.MOOD } }),
  ])
  console.log(`✅ Created ${tags.length} tags`)

  // Create sample collections
  const collection1 = await prisma.collection.create({
    data: {
      name: 'Brand Assets',
      description: 'Official brand logos, colors, and guidelines',
      createdById: contentManager.id,
      isPublic: true,
      isPinned: true
    }
  })

  const collection2 = await prisma.collection.create({
    data: {
      name: 'Product Photography',
      description: 'High-quality product photos for marketing',
      createdById: photographer.id,
      isPublic: true
    }
  })

  const collection3 = await prisma.collection.create({
    data: {
      name: 'Social Media Templates',
      description: 'Ready-to-use templates for social media posts',
      createdById: designer.id,
      isPublic: true
    }
  })

  console.log(`✅ Created ${3} collections`)

  // Create notification preferences for users
  await Promise.all([
    prisma.notificationPreferences.create({
      data: {
        userId: adminUser.id,
        emailEnabled: true,
        emailAssetApproved: true,
        emailAssetRejected: true,
        emailReviewAssigned: true,
        emailAssetShared: true,
        emailCollectionShared: true,
        inAppEnabled: true,
        inAppAssetApproved: true,
        inAppAssetRejected: true,
        inAppReviewAssigned: true,
        inAppAssetShared: true,
        inAppCollectionShared: true,
        inAppSystemUpdates: true,
        digestEnabled: true,
        digestFrequency: 'WEEKLY'
      }
    }),
    prisma.notificationPreferences.create({
      data: {
        userId: contentManager.id,
        emailEnabled: true,
        emailAssetApproved: true,
        emailAssetRejected: true,
        emailReviewAssigned: true,
        emailAssetShared: true,
        emailCollectionShared: true,
        inAppEnabled: true,
        inAppAssetApproved: true,
        inAppAssetRejected: true,
        inAppReviewAssigned: true,
        inAppAssetShared: true,
        inAppCollectionShared: true,
        inAppSystemUpdates: false,
        digestEnabled: true,
        digestFrequency: 'WEEKLY'
      }
    }),
    prisma.notificationPreferences.create({
      data: {
        userId: photographer.id,
        emailEnabled: false,
        emailAssetApproved: false,
        emailAssetRejected: false,
        emailReviewAssigned: false,
        emailAssetShared: false,
        emailCollectionShared: false,
        inAppEnabled: true,
        inAppAssetApproved: true,
        inAppAssetRejected: true,
        inAppReviewAssigned: true,
        inAppAssetShared: false,
        inAppCollectionShared: false,
        inAppSystemUpdates: false,
        digestEnabled: false,
        digestFrequency: 'NEVER'
      }
    })
  ])
  console.log(`✅ Created notification preferences`)

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Test Account Credentials:')
  console.log('================================')
  console.log('All passwords are: Test@123')
  console.log('================================')
  console.log('\n🔐 Admin Account:')
  console.log('   Email: admin@contenthub.com')
  console.log('   Role: ADMIN (Full system access)')
  
  console.log('\n📝 Content Manager:')
  console.log('   Email: manager@contenthub.com')
  console.log('   Role: CONTENT_MANAGER (Manage all content)')
  
  console.log('\n🎨 Creative Accounts:')
  console.log('   Email: photographer@contenthub.com')
  console.log('   Role: CREATIVE - Photographer')
  console.log('')
  console.log('   Email: designer@contenthub.com')
  console.log('   Role: CREATIVE - Designer')
  console.log('')
  console.log('   Email: videographer@contenthub.com')
  console.log('   Role: CREATIVE - Videographer')
  console.log('')
  console.log('   Email: 3dartist@contenthub.com')
  console.log('   Role: CREATIVE - 3D Artist')
  
  console.log('\n✅ Reviewer Account:')
  console.log('   Email: reviewer@contenthub.com')
  console.log('   Role: REVIEWER (Review & approve content)')
  
  console.log('\n👤 Regular Users:')
  console.log('   Email: john.doe@contenthub.com')
  console.log('   Role: USER (View & download)')
  console.log('')
  console.log('   Email: jane.smith@contenthub.com')
  console.log('   Role: USER (View & download)')
  
  console.log('\n⚠️  Special Test Accounts:')
  console.log('   Email: unverified@contenthub.com')
  console.log('   Status: Email not verified')
  console.log('')
  console.log('   Email: inactive@contenthub.com')
  console.log('   Status: Account deactivated')
  console.log('================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })