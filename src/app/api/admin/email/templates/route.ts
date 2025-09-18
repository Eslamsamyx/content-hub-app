import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sesService } from '@/lib/ses-enhanced'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templates = await sesService.listTemplates()
    
    return NextResponse.json({
      templates: templates.map(name => ({
        id: name,
        name,
        subject: 'Template subject',
        description: 'AWS SES Template'
      }))
    })
  } catch (error: any) {
    console.error('Error getting email templates:', error)
    return NextResponse.json(
      { templates: [] },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const template = await request.json()
    
    // Convert template format if needed
    const sesTemplate = {
      name: template.TemplateName || template.name,
      subject: template.SubjectPart || template.subject,
      htmlBody: template.HtmlPart || template.html || template.htmlBody,
      textBody: template.TextPart || template.text || template.textBody,
    }
    
    await sesService.createTemplate(sesTemplate)
    
    return NextResponse.json({
      success: true,
      message: 'Template created successfully'
    })
  } catch (error: any) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    
    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    await sesService.deleteTemplate(name)
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    )
  }
}