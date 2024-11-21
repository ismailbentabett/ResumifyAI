import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { z } from 'zod';

import { join } from 'path';
import { stat, mkdir, writeFile, unlink } from 'fs/promises';
import mime from 'mime';
import fs from 'fs';
import { ratelimit } from '@/lib/rate-limit';

const IS_PROD = process.env.NODE_ENV === 'production';

// Initialize Vertex AI
const vertex = createVertex({
  project: process.env.GOOGLE_PROJECT_ID,
  location: process.env.GOOGLE_REGION ?? 'us-central1',
  googleAuthOptions: {
    credentials: JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIALS ?? '{}', 'base64').toString(
        'utf-8'
      )
    ),
  },
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

async function ensureDirectoryExists(path: string) {
  try {
    await stat(path);
  } catch {
    await mkdir(path, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  // const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'localhost';
  // const { success, remaining } = await ratelimit.limit(`resume-reviewer-${ip}`);

  // if (!success) {
  //   return NextResponse.json(
  //     {
  //       error:
  //         'You have exceeded the maximum number of requests allowed. Try again in 1 hour.',
  //       remaining,
  //     },
  //     { status: 429 }
  //   );
  // }

  let filePath: string | null = null;
  try {
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

    // Write the file to disk with Buffer
    await writeFile(filePath, new Uint8Array(buffer));

    const { object: check } = await generateObject({
      model: vertex('gemini-1.5-flash-002'),
      system: `
        You are an expert in file validation and data processing. Check whether the file is a resume or not.
        Resume files are typically in PDF format and contain information about a person's work experience, education, and skills.
        Resume must have information about the person's contact details, such as name, email, address, and maybe phone number.
      `,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Check whether the file is a resume or not.',
            },
            {
              type: 'file',
              data: fs.readFileSync(filePath),
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      schema: z.object({
        isResume: z.boolean().describe('Whether the file is a resume'),
        confidence: z.number().min(0).max(1).describe('Confidence score'),
      }),
    });

    if (!check.isResume) {
      throw new Error('The provided file is not a resume');
    }

    if (check.confidence <= 0.85) {
      throw new Error('The provided file does not seem to be a resume');
    }

    const fileUrl = join(uploadDir, filename);
    const { object: analysis } = await generateObject({
      model: vertex('gemini-1.5-flash-002'),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze the resume provided in the file.',
            },
            {
              type: 'file',
              data: fs.readFileSync(fileUrl),
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      temperature: 0.4,
      maxTokens: 2048,
      topK: 40,
      topP: 0.8,
      schema: z.object({
        scores: z.object({
          overall: z.number().min(0).max(100).describe('Overall score'),
          experience: z.number().min(0).max(100).describe('Experience score'),
          education: z.number().min(0).max(100).describe('Education score'),
          skills: z.number().min(0).max(100).describe('Skills score'),
          projects: z.number().min(0).max(100).describe('Projects score'),
          impact: z.number().min(0).max(100).describe('Impact score'),
          format: z.number().min(0).max(100).describe('Format score'),
        }),
        sections: z.object({
          impact: z.object({
            strengths: z.array(z.string()).describe('Impact strengths'),
            improvements: z.array(z.string()).describe('Impact improvements'),
          }),
          education: z.object({
            strengths: z.array(z.string()).describe('Education strengths'),
            improvements: z
              .array(z.string())
              .describe('Education improvements'),
          }),
          projects: z.object({
            strengths: z.array(z.string()).describe('Projects strengths'),
            improvements: z.array(z.string()).describe('Projects improvements'),
          }),
          skills: z.object({
            strengths: z.array(z.string()).describe('Skills strengths'),
            improvements: z.array(z.string()).describe('Skills improvements'),
          }),
          experience: z.object({
            strengths: z.array(z.string()).describe('Experience strengths'),
            improvements: z
              .array(z.string())
              .describe('Experience improvements'),
          }),
          format: z.object({
            strengths: z.array(z.string()).describe('Format strengths'),
            improvements: z.array(z.string()).describe('Format improvements'),
          }),
        }),
        recommendations: z.array(z.string()).describe('Recommendations'),
      }),
    });

    // Transform the analysis into the expected format
    const formattedAnalysis = {
      scores: [
        { label: 'Overall', score: analysis.scores.overall, color: '#f97316' },
        {
          label: 'Experience',
          score: analysis.scores.experience,
          color: '#f97316',
        },
        {
          label: 'Education',
          score: analysis.scores.education,
          color: '#f97316',
        },
        { label: 'Skills', score: analysis.scores.skills, color: '#f97316' },
        {
          label: 'Projects',
          score: analysis.scores.projects,
          color: '#f97316',
        },
        { label: 'Impact', score: analysis.scores.impact, color: '#f97316' },
        { label: 'Format', score: analysis.scores.format, color: '#f97316' },
      ],
      analysis: {
        impact: {
          strengths: analysis.sections.impact.strengths,
          improvements: analysis.sections.impact.improvements,
        },
        education: {
          strengths: analysis.sections.education.strengths,
          improvements: analysis.sections.education.improvements,
        },
        projects: {
          strengths: analysis.sections.projects.strengths,
          improvements: analysis.sections.projects.improvements,
        },
        skills: {
          strengths: analysis.sections.skills.strengths,
          improvements: analysis.sections.skills.improvements,
        },
        experience: {
          strengths: analysis.sections.experience.strengths,
          improvements: analysis.sections.experience.improvements,
        },
        format: {
          strengths: analysis.sections.format.strengths,
          improvements: analysis.sections.format.improvements,
        },
        recommendations: analysis.recommendations,
      },
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
