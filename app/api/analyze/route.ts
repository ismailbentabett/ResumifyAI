import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

import { join } from 'path';
import { stat, mkdir, writeFile, unlink } from 'fs/promises';
import mime from 'mime';
import fs from 'fs';
import { ratelimit } from '@/lib/rate-limit';

const IS_PROD = process.env.NODE_ENV === 'production';

// Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
   - specific strengths if needed
   - specific areas for improvement if needed

3. Key recommendations for improvement

Focus on actionable insights and quantifiable metrics. Be specific and professional.`;

// Helper function to ensure directory exists
async function ensureDirectoryExists(path: string) {
  try {
    await stat(path);
  } catch {
    await mkdir(path, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  let filePath: string | null = null;

  try {
    // Parse the uploaded file
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Invalid resume text provided' },
        { status: 400 }
      );
    }

    if (file.size > 3 * 1024 * 1024) {
      throw new Error('The provided file exceeds the maximum file size of 3MB');
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Handle file upload
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

    await writeFile(filePath, new Uint8Array(buffer));

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Validate if the file is a resume
    const validationResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `
            You are an expert in file validation and data processing. Check whether the file is a resume or not.
            Resume files typically contain information about work experience, education, skills, and projects.
          `,
        },
        {
          role: 'user',
          content: `Please validate the following file content: \n\n${fileContent}`,
        },
      ],
    });

    const validationMessage =
      validationResponse.choices[0]?.message?.content || '';
    if (!validationMessage.includes('true')) {
      throw new Error('The provided file does not appear to be a valid resume');
    }

    // Analyze the resume
    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the following resume content: \n\n${fileContent}`,
        },
      ],
    });

    const analysisMessage =
      analysisResponse.choices[0]?.message?.content || '';
    if (!analysisMessage) {
      throw new Error('Failed to analyze the resume content.');
    }

    // Return the analysis result
    const formattedAnalysis = {
      analysis: analysisMessage,
    };

    if (filePath) {
      try {
        await unlink(filePath); // Delete the file after processing
      } catch (deleteError) {
        console.error('Failed to delete file:', deleteError);
      }
    }

    return NextResponse.json(formattedAnalysis);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    if (filePath) {
      try {
        await unlink(filePath); // Delete the file after processing
      } catch (deleteError) {
        console.error('Failed to delete file:', deleteError);
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to analyze resume',
      },
      { status: 500 }
    );
  }
}
