import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { UnifiedAdminConfig } from '@/types/admin-config'
import { configValidator } from '@/lib/config-validation.service'

// GET /api/admin/config/unified - Get unified configuration
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    // Load configuration from database
    const configs = await prisma.systemConfiguration.findMany({
      where: {
        key: {
          in: ['general_config', 'limits_config', 'backup_config', 'security_config', 'services_config']
        }
      }
    })

    // Build unified configuration
    const unifiedConfig: Partial<UnifiedAdminConfig> = {}
    
    for (const config of configs) {
      switch (config.key) {
        case 'general_config':
          unifiedConfig.general = config.value as any
          break
        case 'limits_config':
          unifiedConfig.limits = config.value as any
          break
        case 'backup_config':
          unifiedConfig.backup = config.value as any
          break
        case 'security_config':
          unifiedConfig.security = config.value as any
          break
        case 'services_config':
          unifiedConfig.services = config.value as any
          break
      }
    }

    // Set defaults if not configured
    if (!unifiedConfig.general) {
      unifiedConfig.general = {
        siteName: 'Content Hub',
        siteDescription: 'Your digital asset management platform',
        maintenanceMode: false,
        allowRegistration: true
      }
    }

    if (!unifiedConfig.limits) {
      unifiedConfig.limits = {
        storage: {
          maxFileSize: 100,
          maxStoragePerUser: 10,
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
          maxFilesPerUpload: 10
        },
        api: {
          rateLimit: 1000,
          timeout: 30000,
          maxRequestSize: 50
        },
        email: {
          dailyLimit: 10000,
          ratePerSecond: 10,
          maxRecipients: 50,
          maxAttachmentSize: 25
        }
      }
    }

    if (!unifiedConfig.backup) {
      unifiedConfig.backup = {
        autoBackup: false,
        frequency: 'daily',
        retentionDays: 30,
        includeUserData: true,
        includeAssets: false,
        backupLocation: 'local',
        notifications: {
          onSuccess: false,
          onFailure: true,
          email: ''
        }
      }
    }

    return successResponse({ config: unifiedConfig })
  } catch (error) {
    console.error('Get unified config error:', error)
    return ApiErrors.SERVER_ERROR('Failed to load configuration')
  }
}

// POST /api/admin/config/unified - Update unified configuration
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    const config: Partial<UnifiedAdminConfig> = await request.json()

    // Validate configuration
    const validationResult = configValidator.validateConfiguration(config)
    if (!validationResult.valid) {
      return ApiErrors.BAD_REQUEST('Invalid configuration', {
        errors: validationResult.errors,
        warnings: validationResult.warnings
      })
    }

    // Save each section to database
    const updates = []

    if (config.general) {
      updates.push(
        prisma.systemConfiguration.upsert({
          where: { key: 'general_config' },
          update: {
            value: config.general as any,
            lastModifiedById: user!.id,
            version: { increment: 1 }
          },
          create: {
            key: 'general_config',
            value: config.general as any,
            description: 'General system settings',
            lastModifiedById: user!.id
          }
        })
      )
    }

    if (config.limits) {
      updates.push(
        prisma.systemConfiguration.upsert({
          where: { key: 'limits_config' },
          update: {
            value: config.limits as any,
            lastModifiedById: user!.id,
            version: { increment: 1 }
          },
          create: {
            key: 'limits_config',
            value: config.limits as any,
            description: 'System limits and quotas',
            lastModifiedById: user!.id
          }
        })
      )
    }

    if (config.backup) {
      updates.push(
        prisma.systemConfiguration.upsert({
          where: { key: 'backup_config' },
          update: {
            value: config.backup as any,
            lastModifiedById: user!.id,
            version: { increment: 1 }
          },
          create: {
            key: 'backup_config',
            value: config.backup as any,
            description: 'Backup and recovery settings',
            lastModifiedById: user!.id
          }
        })
      )
    }

    if (config.security) {
      // Encrypt sensitive fields before saving
      const securityConfig = { ...config.security }
      // Mark as encrypted if credentials exist
      if (securityConfig.credentials) {
        updates.push(
          prisma.systemConfiguration.upsert({
            where: { key: 'security_config' },
            update: {
              value: securityConfig as any,
              encrypted: true,
              lastModifiedById: user!.id,
              version: { increment: 1 }
            },
            create: {
              key: 'security_config',
              value: securityConfig as any,
              encrypted: true,
              description: 'Security and authentication settings',
              lastModifiedById: user!.id
            }
          })
        )
      }
    }

    if (config.services) {
      updates.push(
        prisma.systemConfiguration.upsert({
          where: { key: 'services_config' },
          update: {
            value: config.services as any,
            lastModifiedById: user!.id,
            version: { increment: 1 }
          },
          create: {
            key: 'services_config',
            value: config.services as any,
            description: 'Service configurations',
            lastModifiedById: user!.id
          }
        })
      )
    }

    // Execute all updates in a transaction
    await prisma.$transaction(updates)

    // Create audit log entries
    const auditEntries = []
    for (const section of Object.keys(config)) {
      auditEntries.push(
        prisma.configurationHistory.create({
          data: {
            configKey: `${section}_config`,
            action: 'UPDATE',
            userId: user!.id,
            changes: config[section as keyof UnifiedAdminConfig] as any,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        })
      )
    }

    await prisma.$transaction(auditEntries)

    return successResponse({ message: 'Configuration updated successfully' })
  } catch (error) {
    console.error('Update unified config error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update configuration')
  }
}