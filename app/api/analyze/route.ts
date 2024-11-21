import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { stat, mkdir, writeFile, unlink } from 'fs/promises';
import fs from 'fs';
import mime from 'mime';
import OpenAI from 'openai';

const IS_PROD = process.env.NODE_ENV === 'production';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are an expert resume reviewer. Provide detailed feedback using the following structure:

1. Scores (0-100) for:
   - Overall
   - Experience
   - Education
   - Skills
   - Projects
   - Impact
   - Format

2. Strengths and areas for improvement for:
   - Experience
   - Education
   - Skills
   - Projects
   - Format

3. Key recommendations for improvement`;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY! });

async function ensureDirectoryExists(path: string) {
  try {
    await stat(path);
  } catch {
    await mkdir(path, { recursive: true });
  }
}

function preprocessResume(content: string): string[] {
  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const line of lines) {
    if (currentChunk.length + line.length > 1000) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += `${line}\n`;
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}

async function analyzeChunk(chunk: string): Promise<any> {
  const analysisPrompt = `Analyze this resume section and provide feedback in JSON format. Respond ONLY with JSON containing scores and recommendations. Section: ${chunk}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: analysisPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response from OpenAI');

    console.log('Analysis Response:', content); // Debugging

    const analysisResult = JSON.parse(content); // Assume valid JSON for simplicity
    return analysisResult;
  } catch (error) {
    console.error('Error analyzing resume chunk:', error);
    throw new Error('Failed to analyze resume section.');
  }
}

export async function POST(req: NextRequest) {
  let filePath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }

    if (file.size > 3 * 1024 * 1024) {
      throw new Error('The provided file exceeds the maximum size of 3MB');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let uploadDir = join(process.cwd(), 'public', 'uploads');
    if (IS_PROD) uploadDir = '/tmp';

    await ensureDirectoryExists(uploadDir);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${file.name.replace(/\.[^/.]+$/, '')}-${uniqueSuffix}.${mime.getExtension(file.type)}`;
    filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);

    // Read and preprocess file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const chunks = preprocessResume(fileContent);
    console.log('Resume Chunks:', chunks); // Debugging

    // Analyze each chunk
    const analysisResults = [];
    for (const chunk of chunks) {
      const analysis = await analyzeChunk(chunk);
      analysisResults.push(analysis);
    }

    await unlink(filePath);

    return NextResponse.json({ analysis: analysisResults });
  } catch (error) {
    console.error('Error processing request:', error);
    if (filePath) {
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error('Failed to clean up file:', cleanupError);
      }
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
