import fs from 'fs'
import path from 'path'

interface ApiEndpoint {
  path: string
  methods: string[]
  file: string
  requiresAuth: boolean
  description: string
}

function scanApiDirectory(dir: string, basePath: string = ''): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = []
  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    
    if (item.isDirectory()) {
      // Handle dynamic routes
      const routePath = item.name.startsWith('[') 
        ? basePath + '/' + item.name.replace('[', ':').replace(']', '')
        : basePath + '/' + item.name
      
      endpoints.push(...scanApiDirectory(fullPath, routePath))
    } else if (item.name === 'route.ts' || item.name === 'route.js') {
      const fileContent = fs.readFileSync(fullPath, 'utf-8')
      const methods: string[] = []
      
      // Extract HTTP methods
      if (fileContent.includes('export async function GET')) methods.push('GET')
      if (fileContent.includes('export async function POST')) methods.push('POST')
      if (fileContent.includes('export async function PUT')) methods.push('PUT')
      if (fileContent.includes('export async function DELETE')) methods.push('DELETE')
      if (fileContent.includes('export async function PATCH')) methods.push('PATCH')
      
      // Check if requires auth
      const requiresAuth = fileContent.includes('requireAuth(') || 
                          fileContent.includes('requireRole(') ||
                          fileContent.includes('requirePermission(')
      
      // Extract description from comments
      const descMatch = fileContent.match(/\/\/\s*(.+?)(?:\n|$)/)
      const description = descMatch ? descMatch[1] : ''
      
      if (methods.length > 0) {
        endpoints.push({
          path: '/api' + basePath,
          methods,
          file: fullPath.replace(process.cwd(), ''),
          requiresAuth,
          description
        })
      }
    }
  }
  
  return endpoints
}

// Scan the API directory
const apiDir = path.join(process.cwd(), 'src/app/api')
const endpoints = scanApiDirectory(apiDir)

// Sort by path
endpoints.sort((a, b) => a.path.localeCompare(b.path))

// Group by category
const categories: Record<string, ApiEndpoint[]> = {}

endpoints.forEach(endpoint => {
  const category = endpoint.path.split('/')[2] || 'root'
  if (!categories[category]) categories[category] = []
  categories[category].push(endpoint)
})

// Generate markdown documentation
let markdown = '# API Endpoints Documentation\n\n'
markdown += `Generated on: ${new Date().toISOString()}\n\n`
markdown += `Total Endpoints: ${endpoints.length}\n\n`

// Table of contents
markdown += '## Table of Contents\n\n'
Object.keys(categories).sort().forEach(category => {
  markdown += `- [${category.charAt(0).toUpperCase() + category.slice(1)}](#${category})\n`
})
markdown += '\n---\n\n'

// Detailed endpoints by category
Object.keys(categories).sort().forEach(category => {
  markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
  
  categories[category].forEach(endpoint => {
    markdown += `### \`${endpoint.path}\`\n`
    markdown += `- **Methods:** ${endpoint.methods.join(', ')}\n`
    markdown += `- **Auth Required:** ${endpoint.requiresAuth ? '✅ Yes' : '❌ No'}\n`
    markdown += `- **File:** \`${endpoint.file}\`\n`
    if (endpoint.description) {
      markdown += `- **Description:** ${endpoint.description}\n`
    }
    markdown += '\n'
  })
})

// Generate JSON for testing
const json = {
  generated: new Date().toISOString(),
  totalEndpoints: endpoints.length,
  endpoints: endpoints,
  byCategory: categories
}

// Write files
fs.writeFileSync('API_ENDPOINTS.md', markdown)
fs.writeFileSync('api-endpoints.json', JSON.stringify(json, null, 2))

console.log(`✅ Found ${endpoints.length} API endpoints`)
console.log('📄 Documentation written to API_ENDPOINTS.md')
console.log('📄 JSON data written to api-endpoints.json')

// Print summary
console.log('\n📊 Summary by Category:')
Object.keys(categories).sort().forEach(category => {
  console.log(`  ${category}: ${categories[category].length} endpoints`)
})

export { endpoints }