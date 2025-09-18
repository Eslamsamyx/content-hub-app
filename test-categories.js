const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCategories() {
  try {
    // Count all assets
    const totalAssets = await prisma.asset.count()
    console.log('Total assets in database:', totalAssets)
    
    // Count by type
    const types = ['VIDEO', 'IMAGE', 'MODEL_3D', 'DESIGN', 'AUDIO', 'DOCUMENT']
    
    for (const type of types) {
      const count = await prisma.asset.count({
        where: { type }
      })
      console.log(`${type}: ${count}`)
    }
    
    // Count public assets
    console.log('\nPublic assets:')
    const publicTotal = await prisma.asset.count({
      where: { visibility: 'PUBLIC' }
    })
    console.log('Total public:', publicTotal)
    
    for (const type of types) {
      const count = await prisma.asset.count({
        where: { 
          type,
          visibility: 'PUBLIC'
        }
      })
      console.log(`Public ${type}: ${count}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCategories()