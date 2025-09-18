import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

export const prisma = new PrismaClient()

export interface TestUser {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  token?: string
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    id: '',
    email: `admin.${nanoid(6)}@test.com`,
    password: 'Admin@123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN'
  },
  contentManager: {
    id: '',
    email: `manager.${nanoid(6)}@test.com`,
    password: 'Manager@123',
    firstName: 'Content',
    lastName: 'Manager',
    role: 'CONTENT_MANAGER'
  },
  reviewer: {
    id: '',
    email: `reviewer.${nanoid(6)}@test.com`,
    password: 'Reviewer@123',
    firstName: 'Review',
    lastName: 'User',
    role: 'REVIEWER'
  },
  creative: {
    id: '',
    email: `creative.${nanoid(6)}@test.com`,
    password: 'Creative@123',
    firstName: 'Creative',
    lastName: 'User',
    role: 'CREATIVE'
  },
  regularUser: {
    id: '',
    email: `user.${nanoid(6)}@test.com`,
    password: 'User@123',
    firstName: 'Regular',
    lastName: 'User',
    role: 'USER'
  }
}

export async function setupTestDatabase() {
  console.log('🔧 Setting up test database...')
  
  // Clean up existing test data
  await cleanupTestData()
  
  // Create test users
  for (const [key, user] of Object.entries(testUsers)) {
    const hashedPassword = await bcrypt.hash(user.password, 12)
    const createdUser = await prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as any,
        isActive: true,
        emailVerified: new Date()
      }
    })
    testUsers[key].id = createdUser.id
    console.log(`  ✅ Created ${key} user: ${user.email}`)
  }
  
  // Create test assets
  const testAssets = await createTestAssets()
  
  // Create test collections
  const testCollections = await createTestCollections()
  
  // Create test tags
  const testTags = await createTestTags()
  
  console.log('✅ Test database setup complete')
  
  return {
    users: testUsers,
    assets: testAssets,
    collections: testCollections,
    tags: testTags
  }
}

async function createTestAssets() {
  const assets = []
  
  // Create different types of assets
  const assetTypes = ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'MODEL_3D', 'DESIGN']
  
  for (let i = 0; i < 10; i++) {
    const asset = await prisma.asset.create({
      data: {
        title: `Test Asset ${i + 1}`,
        description: `Description for test asset ${i + 1}`,
        filename: `test-asset-${i + 1}.jpg`,
        originalFilename: `original-${i + 1}.jpg`,
        fileKey: `assets/test/${nanoid()}.jpg`,
        fileSize: BigInt(1024 * 1024 * (i + 1)), // Variable sizes
        mimeType: 'image/jpeg',
        format: 'jpg',
        type: assetTypes[i % assetTypes.length] as any,
        category: 'Marketing',
        uploadStatus: 'COMPLETED',
        processingStatus: 'COMPLETED',
        visibility: 'INTERNAL',
        usage: 'INTERNAL',
        uploadedById: testUsers.creative.id,
        width: 1920,
        height: 1080
      }
    })
    assets.push(asset)
  }
  
  console.log(`  ✅ Created ${assets.length} test assets`)
  return assets
}

async function createTestCollections() {
  const collections = []
  
  for (let i = 0; i < 3; i++) {
    const collection = await prisma.collection.create({
      data: {
        name: `Test Collection ${i + 1}`,
        description: `Description for collection ${i + 1}`,
        isPublic: i === 0, // First collection is public
        isPinned: i === 0,
        createdById: testUsers.creative.id
      }
    })
    collections.push(collection)
  }
  
  console.log(`  ✅ Created ${collections.length} test collections`)
  return collections
}

async function createTestTags() {
  const tagNames = ['marketing', 'product', 'campaign', 'social-media', 'brand']
  const tags = []
  
  for (const name of tagNames) {
    const tag = await prisma.tag.create({
      data: {
        name,
        slug: name,
        category: 'CUSTOM',
        usageCount: 0
      }
    })
    tags.push(tag)
  }
  
  console.log(`  ✅ Created ${tags.length} test tags`)
  return tags
}

export async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...')
  
  // Delete in correct order to respect foreign key constraints
  await prisma.searchHistory.deleteMany({
    where: {
      user: {
        email: {
          contains: '@test.com'
        }
      }
    }
  })
  
  await prisma.activity.deleteMany({
    where: {
      user: {
        email: {
          contains: '@test.com'
        }
      }
    }
  })
  
  await prisma.notification.deleteMany({
    where: {
      user: {
        email: {
          contains: '@test.com'
        }
      }
    }
  })
  
  await prisma.assetTag.deleteMany({
    where: {
      asset: {
        uploadedBy: {
          email: {
            contains: '@test.com'
          }
        }
      }
    }
  })
  
  await prisma.assetCollection.deleteMany({
    where: {
      collection: {
        createdBy: {
          email: {
            contains: '@test.com'
          }
        }
      }
    }
  })
  
  await prisma.review.deleteMany({
    where: {
      asset: {
        uploadedBy: {
          email: {
            contains: '@test.com'
          }
        }
      }
    }
  })
  
  await prisma.asset.deleteMany({
    where: {
      uploadedBy: {
        email: {
          contains: '@test.com'
        }
      }
    }
  })
  
  await prisma.collection.deleteMany({
    where: {
      createdBy: {
        email: {
          contains: '@test.com'
        }
      }
    }
  })
  
  await prisma.tag.deleteMany({
    where: {
      slug: {
        in: ['marketing', 'product', 'campaign', 'social-media', 'brand']
      }
    }
  })
  
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@test.com'
      }
    }
  })
  
  console.log('✅ Test data cleaned up')
}

export function generateAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export function createMockFile(name: string = 'test.jpg', size: number = 1024) {
  return {
    name,
    size,
    type: 'image/jpeg',
    lastModified: Date.now()
  }
}