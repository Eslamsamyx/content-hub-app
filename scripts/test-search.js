const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSearchData() {
  try {
    console.log('🔍 Setting up test data for search...\n');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.error('❌ Admin user not found. Please run create-test-user.js first');
      return;
    }

    // Create some tags
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'marketing' },
        update: {},
        create: {
          name: 'Marketing',
          slug: 'marketing',
          category: 'PURPOSE',
          color: '#8B5CF6',
        },
      }),
      prisma.tag.upsert({
        where: { slug: 'brand-assets' },
        update: {},
        create: {
          name: 'Brand Assets',
          slug: 'brand-assets',
          category: 'ASSET_TYPE',
          color: '#06B6D4',
        },
      }),
      prisma.tag.upsert({
        where: { slug: '2024' },
        update: {},
        create: {
          name: '2024',
          slug: '2024',
          category: 'CUSTOM',
          color: '#10B981',
        },
      }),
    ]);

    console.log('✅ Created/updated tags:', tags.map(t => t.name).join(', '));

    // Create test assets
    const testAssets = [
      {
        title: 'Company Logo - Primary Version',
        description: 'Main company logo in various formats',
        filename: 'company-logo-primary.png',
        originalFilename: 'company-logo-primary.png',
        fileKey: 'assets/image/2024/01/test_logo_primary.png',
        fileSize: BigInt(1024 * 1024 * 2), // 2MB
        mimeType: 'image/png',
        format: 'png',
        type: 'IMAGE',
        category: 'Brand',
        company: 'TechCorp',
        eventName: 'Brand Refresh 2024',
        productionYear: 2024,
        width: 1920,
        height: 1080,
        uploadStatus: 'COMPLETED',
        processingStatus: 'COMPLETED',
        uploadedById: adminUser.id,
      },
      {
        title: 'Product Demo Video - Q4 2024',
        description: 'Product demonstration video for sales team',
        filename: 'product-demo-q4.mp4',
        originalFilename: 'product-demo-q4.mp4',
        fileKey: 'assets/video/2024/01/test_demo_video.mp4',
        fileSize: BigInt(1024 * 1024 * 150), // 150MB
        mimeType: 'video/mp4',
        format: 'mp4',
        type: 'VIDEO',
        category: 'Marketing',
        company: 'TechCorp',
        project: 'Q4 Campaign',
        productionYear: 2024,
        width: 1920,
        height: 1080,
        duration: 180, // 3 minutes
        uploadStatus: 'COMPLETED',
        processingStatus: 'COMPLETED',
        uploadedById: adminUser.id,
      },
      {
        title: 'Annual Report 2024',
        description: 'Company annual report with financial data',
        filename: 'annual-report-2024.pdf',
        originalFilename: 'annual-report-2024.pdf',
        fileKey: 'assets/document/2024/01/test_annual_report.pdf',
        fileSize: BigInt(1024 * 1024 * 5), // 5MB
        mimeType: 'application/pdf',
        format: 'pdf',
        type: 'DOCUMENT',
        category: 'Corporate',
        company: 'TechCorp',
        productionYear: 2024,
        uploadStatus: 'COMPLETED',
        processingStatus: 'COMPLETED',
        uploadedById: adminUser.id,
        readyForPublishing: true,
      },
    ];

    // Create assets
    for (const assetData of testAssets) {
      const asset = await prisma.asset.create({
        data: assetData,
      });

      // Add tags to assets
      if (assetData.category === 'Brand') {
        await prisma.assetTag.create({
          data: {
            assetId: asset.id,
            tagId: tags[1].id, // Brand Assets tag
            addedBy: adminUser.id,
          },
        });
      }
      if (assetData.category === 'Marketing') {
        await prisma.assetTag.create({
          data: {
            assetId: asset.id,
            tagId: tags[0].id, // Marketing tag
            addedBy: adminUser.id,
          },
        });
      }
      // Add year tag to all
      await prisma.assetTag.create({
        data: {
          assetId: asset.id,
          tagId: tags[2].id, // 2024 tag
          addedBy: adminUser.id,
        },
      });

      console.log(`✅ Created asset: ${asset.title}`);
    }

    // Create a test collection
    const collection = await prisma.collection.create({
      data: {
        name: 'Q4 2024 Marketing Materials',
        description: 'All marketing assets for Q4 2024 campaign',
        isPublic: true,
        createdById: adminUser.id,
      },
    });

    console.log(`✅ Created collection: ${collection.name}`);

    // Get created assets and add to collection
    const createdAssets = await prisma.asset.findMany({
      where: {
        uploadedById: adminUser.id,
        category: { in: ['Brand', 'Marketing'] },
      },
      take: 2,
    });

    if (createdAssets.length > 0) {
      await prisma.assetCollection.createMany({
        data: createdAssets.map((asset, index) => ({
          collectionId: collection.id,
          assetId: asset.id,
          position: index,
          addedBy: adminUser.id,
        })),
      });
      console.log(`✅ Added ${createdAssets.length} assets to collection`);
    }

    console.log('\n📊 Search Test Data Summary:');
    const [assetCount, tagCount, collectionCount] = await Promise.all([
      prisma.asset.count(),
      prisma.tag.count(),
      prisma.collection.count(),
    ]);
    console.log(`   Assets: ${assetCount}`);
    console.log(`   Tags: ${tagCount}`);
    console.log(`   Collections: ${collectionCount}`);

    console.log('\n🔍 Example Search Queries:');
    console.log('   - Search all: /api/search?q=logo');
    console.log('   - Search by type: /api/search?q=demo&types=VIDEO');
    console.log('   - Search by tag: /api/search?tags=marketing,2024');
    console.log('   - Search with filters: /api/search?q=report&readyForPublishing=true');
    console.log('   - Advanced search: POST /api/search/advanced');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSearchData();