import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { join } from 'path';
import { stat, mkdir, writeFile, unlink } from 'fs/promises';
import mime from 'mime';
import fs from 'fs';

const IS_PROD = process.env.NODE_ENV === 'production';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are an expert resume reviewer with extensive experience in talent acquisition and career counseling. Analyze the provided resume and provide a detailed assessment with the following structure:

1. Numerical scores (0-100) for:
   - Overall
   - Experience
   - Education
   - Skills
   - Projects
   - Impact
   - Format

2. Detailed analysis for each section:
   - Impact & Achievements
   - Education
   - Projects
   - Skills & Expertise
   - Professional Experience
   - Format & Structure

For each section, provide:
   - Specific strengths
   - Areas for improvement

3. Key recommendations for improvement

Focus on actionable insights and quantifiable metrics. Be specific and professional.`;

async function ensureDirectoryExists(path: string) {
  try {
    await stat(path);
  } catch {
    await mkdir(path, { recursive: true });
  }
}

async function callOpenAIAPI(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API Error: ${error.error.message}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(req: NextRequest) {
  let filePath: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No resume file provided' },
        { status: 400 }
      );
    }

    if (file.size > 3 * 1024 * 1024) {
      throw new Error('The provided file exceeds the maximum size of 3MB');
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let uploadDir = join(process.cwd(), 'public', 'uploads');
    if (IS_PROD) {
      uploadDir = '/tmp';
    }

    await ensureDirectoryExists(uploadDir);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${file.name.replace(
      /\.[^/.]+$/,
      ''
    )}-${uniqueSuffix}.${mime.getExtension(file.type)}`;
    filePath = join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const fileData = fs.readFileSync(filePath, { encoding: 'base64' });

    const validationPrompt = `Check whether the following base64-encoded file content is a resume. Resumes typically contain information about a person's work experience, education, and skills. File content: ${fileData}`;

    const validationResponse = await callOpenAIAPI(validationPrompt);
    const validationResult = z.object({
      isResume: z.boolean(),
      confidence: z.number().min(0).max(1),
    }).parse(JSON.parse(validationResponse));

    if (!validationResult.isResume || validationResult.confidence < 0.85) {
      throw new Error('The provided file is not a valid resume');
    }

    const analysisPrompt = `Analyze the following resume in detail and provide the assessment as specified in the system prompt. Resume content (base64): ${fileData}`;
    const analysisResponse = await callOpenAIAPI(analysisPrompt);

    const analysisResult = z.object({
      scores: z.object({
        overall: z.number().min(0).max(100),
        experience: z.number().min(0).max(100),
        education: z.number().min(0).max(100),
        skills: z.number().min(0).max(100),
        projects: z.number().min(0).max(100),
        impact: z.number().min(0).max(100),
        format: z.number().min(0).max(100),
      }),
      sections: z.object({
        impact: z.object({
          strengths: z.array(z.string()),
          improvements: z.array(z.string()),
        }),
        education: z.object({
          strengths: z.array(z.string()),
          improvements: z.array(z.string()),
        }),
        projects: z.object({
          strengths: z.array(z.string()),
          improvements: z.array(z.string()),
        }),
        skills: z.object({
          strengths: z.array(z.string()),
          improvements: z.array(z.string()),
        }),
        experience: z.object({
          strengths: z.array(z.string()),
          improvements: z.array(z.string()),
        }),
        format: z.object({
          strengths: z.array(z.string()),
          improvements: z.array(z.string()),
        }),
      }),
      recommendations: z.array(z.string()),
    }).parse(JSON.parse(analysisResponse));

    if (filePath) {
      try {
        await unlink(filePath);
      } catch (deleteError) {
        console.error('Failed to delete file:', deleteError);
      }
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    if (filePath) {
      try {
        await unlink(filePath);
      } catch (deleteError) {
        console.error('Failed to delete file:', deleteError);
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze resume',
      },
      { status: 500 }
    );
  }
}
