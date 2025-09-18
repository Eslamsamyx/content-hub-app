# AI Quick Start Implementation Guide

## Quick Win: Auto-Tagging with AWS Rekognition

This guide provides step-by-step implementation for adding AI auto-tagging to your Content Hub.

### Step 1: Install Dependencies

```bash
npm install @aws-sdk/client-rekognition @aws-sdk/client-comprehend openai @pinecone-database/pinecone sharp
```

### Step 2: Database Schema Updates

```sql
-- Add to prisma/schema.prisma

model AIAnalysis {
  id          String   @id @default(cuid())
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  assetId     String   @unique
  
  // AI Generated Tags
  autoTags    String[] // AI-generated tags
  confidence  Float[]  // Confidence scores for each tag
  
  // Object Detection
  objects     Json?    // Detected objects with bounding boxes
  
  // Face Detection
  faces       Json?    // Detected faces with attributes
  
  // Text Detection
  detectedText Json?   // OCR results
  
  // Scene Understanding
  scenes      Json?    // Scene classifications
  
  // Colors
  dominantColors Json? // Color palette
  
  // Moderation
  moderationLabels Json? // NSFW/inappropriate content flags
  isSafe      Boolean  @default(true)
  
  // Quality Metrics
  qualityScore Float?  // 0-100 quality score
  sharpness   Float?   // Sharpness score
  brightness  Float?   // Brightness level
  
  // Processing
  provider    String   // AI provider used
  modelVersion String  // Model version
  processedAt DateTime @default(now())
  
  @@index([assetId])
  @@index([isSafe])
}

model AssetEmbedding {
  id          String   @id @default(cuid())
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  assetId     String   @unique
  
  embedding   Float[]  // Vector embedding
  model       String   // Model used
  dimension   Int      // Vector dimension
  
  createdAt   DateTime @default(now())
  
  @@index([assetId])
}
```

### Step 3: AI Service Implementation

```typescript
// src/lib/ai/rekognition-service.ts

import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  DetectTextCommand,
  DetectModerationLabelsCommand,
  Celebrity,
  Label,
  FaceDetail,
  TextDetection,
  ModerationLabel,
} from '@aws-sdk/client-rekognition';

export class RekognitionService {
  private client: RekognitionClient;

  constructor() {
    this.client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async analyzeImage(imageBuffer: Buffer) {
    const [labels, faces, text, moderation] = await Promise.all([
      this.detectLabels(imageBuffer),
      this.detectFaces(imageBuffer),
      this.detectText(imageBuffer),
      this.detectModerationLabels(imageBuffer),
    ]);

    // Process and combine results
    const autoTags = this.extractTags(labels);
    const confidence = labels.map(l => l.Confidence || 0);
    const isSafe = this.checkSafety(moderation);

    return {
      autoTags,
      confidence,
      objects: labels.map(this.formatLabel),
      faces: faces.map(this.formatFace),
      detectedText: text.map(this.formatText),
      scenes: labels.filter(l => l.Parents?.some(p => p.Name === 'Scene')),
      moderationLabels: moderation,
      isSafe,
      provider: 'aws-rekognition',
      modelVersion: '2024.1',
    };
  }

  private async detectLabels(imageBuffer: Buffer): Promise<Label[]> {
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBuffer },
      MaxLabels: 50,
      MinConfidence: 70,
    });

    const response = await this.client.send(command);
    return response.Labels || [];
  }

  private async detectFaces(imageBuffer: Buffer): Promise<FaceDetail[]> {
    const command = new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
      Attributes: ['ALL'],
    });

    const response = await this.client.send(command);
    return response.FaceDetails || [];
  }

  private async detectText(imageBuffer: Buffer): Promise<TextDetection[]> {
    const command = new DetectTextCommand({
      Image: { Bytes: imageBuffer },
    });

    const response = await this.client.send(command);
    return response.TextDetections || [];
  }

  private async detectModerationLabels(
    imageBuffer: Buffer
  ): Promise<ModerationLabel[]> {
    const command = new DetectModerationLabelsCommand({
      Image: { Bytes: imageBuffer },
      MinConfidence: 60,
    });

    const response = await this.client.send(command);
    return response.ModerationLabels || [];
  }

  private extractTags(labels: Label[]): string[] {
    const tags = new Set<string>();
    
    labels.forEach(label => {
      if (label.Name && label.Confidence! > 80) {
        // Add main label
        tags.add(label.Name.toLowerCase().replace(/\s+/g, '-'));
        
        // Add parent categories
        label.Parents?.forEach(parent => {
          if (parent.Name) {
            tags.add(parent.Name.toLowerCase().replace(/\s+/g, '-'));
          }
        });
      }
    });

    return Array.from(tags);
  }

  private formatLabel(label: Label) {
    return {
      name: label.Name,
      confidence: label.Confidence,
      parents: label.Parents?.map(p => p.Name),
      instances: label.Instances?.map(i => ({
        boundingBox: i.BoundingBox,
        confidence: i.Confidence,
      })),
    };
  }

  private formatFace(face: FaceDetail) {
    return {
      boundingBox: face.BoundingBox,
      confidence: face.Confidence,
      emotions: face.Emotions?.map(e => ({
        type: e.Type,
        confidence: e.Confidence,
      })),
      ageRange: face.AgeRange,
      gender: face.Gender,
      smile: face.Smile,
      eyeglasses: face.Eyeglasses,
      sunglasses: face.Sunglasses,
      beard: face.Beard,
      mustache: face.Mustache,
      eyesOpen: face.EyesOpen,
      mouthOpen: face.MouthOpen,
    };
  }

  private formatText(text: TextDetection) {
    return {
      text: text.DetectedText,
      confidence: text.Confidence,
      type: text.Type,
      boundingBox: text.Geometry?.BoundingBox,
    };
  }

  private checkSafety(moderationLabels: ModerationLabel[]): boolean {
    const unsafeCategories = [
      'Explicit Nudity',
      'Violence',
      'Visually Disturbing',
      'Hate Symbols',
    ];

    return !moderationLabels.some(
      label =>
        unsafeCategories.includes(label.ParentName || '') &&
        (label.Confidence || 0) > 80
    );
  }
}
```

### Step 4: OpenAI Integration for Embeddings

```typescript
// src/lib/ai/openai-service.ts

import OpenAI from 'openai';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateDescription(imageUrl: string, existingTags: string[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at describing images for a digital asset management system. Provide concise, professional descriptions.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Describe this image professionally. Consider these detected elements: ${existingTags.join(', ')}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content || '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  async suggestCategories(description: string, tags: string[]): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Suggest 3-5 relevant categories for organizing this content in a DAM system. Return only category names separated by commas.',
        },
        {
          role: 'user',
          content: `Description: ${description}\nTags: ${tags.join(', ')}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    });

    const categories = response.choices[0].message.content || '';
    return categories.split(',').map(cat => cat.trim());
  }
}
```

### Step 5: AI Processing Worker

```typescript
// src/workers/ai-processor.ts

import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { RekognitionService } from '@/lib/ai/rekognition-service';
import { OpenAIService } from '@/lib/ai/openai-service';
import { getDownloadUrl } from '@/lib/s3';
import redis from '@/lib/redis';

interface AIProcessingJob {
  assetId: string;
  fileKey: string;
  mimeType: string;
}

export class AIProcessorWorker {
  private rekognition: RekognitionService;
  private openai: OpenAIService;

  constructor() {
    this.rekognition = new RekognitionService();
    this.openai = new OpenAIService();
  }

  async start() {
    const worker = new Worker<AIProcessingJob>(
      'ai-processing',
      async (job) => {
        await this.processAsset(job);
      },
      {
        connection: redis,
        concurrency: 5,
      }
    );

    worker.on('completed', (job) => {
      console.log(`AI processing completed for asset ${job.data.assetId}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`AI processing failed for asset ${job?.data.assetId}:`, err);
    });

    return worker;
  }

  private async processAsset(job: Job<AIProcessingJob>) {
    const { assetId, fileKey, mimeType } = job.data;

    try {
      // Update status
      await prisma.asset.update({
        where: { id: assetId },
        data: { processingStatus: 'PROCESSING' },
      });

      // Only process images for now
      if (!mimeType.startsWith('image/')) {
        console.log(`Skipping AI processing for non-image asset ${assetId}`);
        return;
      }

      // Get image from S3
      const imageUrl = await getDownloadUrl(fileKey);
      const response = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      // Run AI analysis
      const analysis = await this.rekognition.analyzeImage(imageBuffer);

      // Generate description with GPT-4 Vision
      const description = await this.openai.generateDescription(
        imageUrl,
        analysis.autoTags
      );

      // Generate embedding for similarity search
      const embeddingText = `${description} ${analysis.autoTags.join(' ')}`;
      const embedding = await this.openai.generateEmbedding(embeddingText);

      // Suggest categories
      const suggestedCategories = await this.openai.suggestCategories(
        description,
        analysis.autoTags
      );

      // Store AI analysis results
      await prisma.aIAnalysis.create({
        data: {
          assetId,
          ...analysis,
        },
      });

      // Store embedding for similarity search
      await prisma.assetEmbedding.create({
        data: {
          assetId,
          embedding,
          model: 'text-embedding-3-small',
          dimension: embedding.length,
        },
      });

      // Update asset with AI-generated data
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          description: description || undefined,
          category: suggestedCategories[0] || undefined,
          processingStatus: 'COMPLETED',
          tags: {
            connectOrCreate: analysis.autoTags.map(tag => ({
              where: { name: tag },
              create: { 
                name: tag,
                category: 'ai-generated',
              },
            })),
          },
        },
      });

      // Track activity
      await prisma.activity.create({
        data: {
          type: 'AI_ANALYSIS',
          description: `AI analysis completed: ${analysis.autoTags.length} tags generated`,
          userId: 'system',
          assetId,
          metadata: {
            tagsGenerated: analysis.autoTags.length,
            hasFaces: analysis.faces.length > 0,
            hasText: analysis.detectedText.length > 0,
            isSafe: analysis.isSafe,
          },
        },
      });

    } catch (error) {
      console.error(`Error processing asset ${assetId}:`, error);
      
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          processingStatus: 'FAILED',
          processingError: error.message,
        },
      });

      throw error;
    }
  }
}
```

### Step 6: API Endpoints

```typescript
// src/app/api/ai/analyze/route.ts

import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Queue } from 'bullmq';
import redis from '@/lib/redis';

const aiQueue = new Queue('ai-processing', { connection: redis });

export async function POST(request: NextRequest) {
  try {
    const { user } = await authMiddleware(request);
    
    const { assetId } = await request.json();

    // Check if asset exists and user has access
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { aiAnalysis: true },
    });

    if (!asset) {
      return ApiErrors.notFound('Asset not found');
    }

    // Check if already analyzed
    if (asset.aiAnalysis) {
      return successResponse({
        message: 'Asset already analyzed',
        analysis: asset.aiAnalysis,
      });
    }

    // Queue for AI processing
    const job = await aiQueue.add('analyze-asset', {
      assetId: asset.id,
      fileKey: asset.fileKey,
      mimeType: asset.mimeType,
    });

    return successResponse({
      message: 'Asset queued for AI analysis',
      jobId: job.id,
      status: 'processing',
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return ApiErrors.serverError('Failed to initiate AI analysis');
  }
}

// GET endpoint to check analysis status
export async function GET(request: NextRequest) {
  try {
    const { user } = await authMiddleware(request);
    
    const assetId = request.nextUrl.searchParams.get('assetId');
    
    if (!assetId) {
      return ApiErrors.badRequest('Asset ID required');
    }

    const analysis = await prisma.aIAnalysis.findUnique({
      where: { assetId },
    });

    if (!analysis) {
      return successResponse({
        status: 'pending',
        message: 'Analysis not yet available',
      });
    }

    return successResponse({
      status: 'completed',
      analysis,
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    return ApiErrors.serverError('Failed to retrieve analysis');
  }
}
```

### Step 7: Similarity Search

```typescript
// src/app/api/ai/similar/route.ts

import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth-middleware';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function GET(request: NextRequest) {
  try {
    const { user } = await authMiddleware(request);
    
    const assetId = request.nextUrl.searchParams.get('assetId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    
    if (!assetId) {
      return ApiErrors.badRequest('Asset ID required');
    }

    // Get asset embedding
    const embedding = await prisma.assetEmbedding.findUnique({
      where: { assetId },
    });

    if (!embedding) {
      return ApiErrors.badRequest('Asset has no embedding. Run AI analysis first.');
    }

    // Query Pinecone for similar vectors
    const index = pinecone.index('content-hub');
    const queryResponse = await index.query({
      vector: embedding.embedding,
      topK: limit + 1, // +1 to exclude self
      includeMetadata: true,
    });

    // Get similar assets (excluding self)
    const similarAssetIds = queryResponse.matches
      .filter(match => match.id !== assetId)
      .map(match => match.id);

    const similarAssets = await prisma.asset.findMany({
      where: {
        id: { in: similarAssetIds },
        visibility: user?.role === 'ADMIN' ? undefined : 'PUBLIC',
      },
      include: {
        tags: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Sort by similarity score
    const sortedAssets = similarAssets.sort((a, b) => {
      const aIndex = similarAssetIds.indexOf(a.id);
      const bIndex = similarAssetIds.indexOf(b.id);
      return aIndex - bIndex;
    });

    return successResponse({
      similar: sortedAssets,
      count: sortedAssets.length,
    });
  } catch (error) {
    console.error('Similarity search error:', error);
    return ApiErrors.serverError('Failed to find similar assets');
  }
}
```

### Step 8: Frontend Integration

```typescript
// src/components/AssetDetail/AIInsights.tsx

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AIInsightsProps {
  assetId: string;
}

export function AIInsights({ assetId }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  useEffect(() => {
    checkAnalysis();
  }, [assetId]);

  const checkAnalysis = async () => {
    try {
      const response = await fetch(`/api/ai/analyze?assetId=${assetId}`);
      const data = await response.json();
      
      if (data.data.status === 'completed') {
        setAnalysis(data.data.analysis);
        setStatus('completed');
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setStatus('processing');

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });

      if (response.ok) {
        // Poll for results
        const pollInterval = setInterval(async () => {
          const result = await checkAnalysis();
          if (status === 'completed') {
            clearInterval(pollInterval);
            setLoading(false);
          }
        }, 2000);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          setLoading(false);
        }, 30000);
      }
    } catch (error) {
      console.error('Failed to run AI analysis:', error);
      setLoading(false);
      setStatus('idle');
    }
  };

  if (!analysis && status === 'idle') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
          <h3 className="text-lg font-semibold mb-2">AI Insights Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            Unlock AI-powered tags, descriptions, and insights for this asset
          </p>
          <Button onClick={runAnalysis} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  if (status === 'processing') {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mr-2" />
          <span>AI is analyzing your asset...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
          AI Insights
        </h3>
        <Button variant="ghost" size="sm" onClick={runAnalysis}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Tags */}
      {analysis.autoTags && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">AI-Generated Tags</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.autoTags.map((tag, index) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-purple-100 text-purple-700"
              >
                {tag}
                <span className="ml-1 text-xs opacity-60">
                  {Math.round(analysis.confidence[index])}%
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Detected Objects */}
      {analysis.objects && analysis.objects.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Detected Objects</h4>
          <div className="space-y-1">
            {analysis.objects.slice(0, 5).map((obj) => (
              <div key={obj.name} className="flex justify-between text-sm">
                <span>{obj.name}</span>
                <span className="text-gray-500">
                  {Math.round(obj.confidence)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faces Detected */}
      {analysis.faces && analysis.faces.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">
            Faces Detected: {analysis.faces.length}
          </h4>
          {analysis.faces[0].emotions && (
            <div className="text-sm text-gray-600">
              Primary emotion: {analysis.faces[0].emotions[0]?.type}
            </div>
          )}
        </div>
      )}

      {/* Safety Status */}
      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm">Content Safety</span>
        <Badge variant={analysis.isSafe ? 'success' : 'destructive'}>
          {analysis.isSafe ? 'Safe' : 'Review Required'}
        </Badge>
      </div>
    </Card>
  );
}
```

### Step 9: Environment Variables

```env
# Add to .env.local

# AWS Rekognition
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Pinecone (for similarity search)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX=content-hub
```

### Step 10: Start the AI Worker

```typescript
// src/scripts/start-workers.ts

import { AIProcessorWorker } from '@/workers/ai-processor';

async function startWorkers() {
  console.log('Starting AI processing worker...');
  
  const aiWorker = new AIProcessorWorker();
  await aiWorker.start();
  
  console.log('AI worker started successfully');
}

startWorkers().catch(console.error);
```

## Testing the Implementation

1. **Upload an image asset**
2. **Navigate to asset details**
3. **Click "Run AI Analysis"**
4. **View generated tags, objects, and insights**
5. **Use similarity search to find related assets**

## Next Steps

1. **Add video analysis** using AWS Rekognition Video
2. **Implement document OCR** for PDFs and documents
3. **Add batch processing** for existing assets
4. **Create AI dashboard** with analytics
5. **Implement smart search** with natural language queries
6. **Add custom model training** for domain-specific recognition

## Monitoring & Optimization

- Track AI API costs in AWS/OpenAI dashboards
- Monitor processing times and queue lengths
- Cache AI results to avoid reprocessing
- Implement rate limiting for API calls
- Set up alerts for failed processing jobs

This implementation provides a solid foundation for AI capabilities in your Content Hub, with immediate value through auto-tagging and similarity search.