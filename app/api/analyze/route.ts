import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { stat, mkdir, writeFile, unlink } from 'fs/promises';
import mime from 'mime';
import fs from 'fs';
import pdfParse from 'pdf-parse'; // For parsing PDF files
import OpenAI from 'openai';

// ** Import OpenAI correctly **

const IS_PROD = process.env.NODE_ENV === 'production';

// ** Initialize OpenAI API correctly **

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

async function ensureDirectoryExists(path) {
  try {
    await stat(path);
  } catch {
    await mkdir(path, { recursive: true });
  }
}

export async function POST(req) {
  let filePath = null;
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'Invalid resume file provided' },
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

    await writeFile(filePath, new Uint8Array(buffer));

    // Extract text from the file
    let resumeText = '';
    if (file.type === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      resumeText = pdfData.text;
    } else if (file.type === 'text/plain') {
      resumeText = fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or text file.');
    }

    // File Validation
    const validationResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert in file validation and data processing. Analyze the following text and determine if it is a resume.

A resume should contain information about a person's work experience, education, skills, and contact details such as name, email, and phone number.`,
        },
        {
          role: 'user',
          content: resumeText.slice(0, 2000), // Limit to 2000 characters
        },
      ],
      functions: [
        {
          name: 'validate_resume',
          parameters: {
            type: 'object',
            properties: {
              isResume: {
                type: 'boolean',
                description: 'Whether the text is a resume',
              },
              confidence: {
                type: 'number',
                description: 'Confidence score of resume validation (0 to 1)',
              },
            },
            required: ['isResume', 'confidence'],
          },
        },
      ],
      function_call: { name: 'validate_resume' },
    });

    const functionCall = validationResponse.data.choices[0].message.function_call;
    const validationResult = JSON.parse(functionCall?.arguments || '{}');

    if (!validationResult.isResume || validationResult.confidence <= 0.85) {
      throw new Error('The provided file does not seem to be a resume');
    }

    // Resume Analysis
    const analysisResponse = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: resumeText.slice(0, 6000) }, // Limit to 6000 characters
      ],
      max_tokens: 2048,
      functions: [
        {
          name: 'analyze_resume',
          parameters: {
            type: 'object',
            properties: {
              scores: {
                type: 'object',
                properties: {
                  overall: { type: 'number', minimum: 0, maximum: 100 },
                  experience: { type: 'number', minimum: 0, maximum: 100 },
                  education: { type: 'number', minimum: 0, maximum: 100 },
                  skills: { type: 'number', minimum: 0, maximum: 100 },
                  projects: { type: 'number', minimum: 0, maximum: 100 },
                  impact: { type: 'number', minimum: 0, maximum: 100 },
                  format: { type: 'number', minimum: 0, maximum: 100 },
                },
                required: [
                  'overall',
                  'experience',
                  'education',
                  'skills',
                  'projects',
                  'impact',
                  'format',
                ],
              },
              sections: {
                type: 'object',
                properties: {
                  impact: {
                    type: 'object',
                    properties: {
                      strengths: { type: 'array', items: { type: 'string' } },
                      improvements: { type: 'array', items: { type: 'string' } },
                    },
                  },
                  experience: {
                    type: 'object',
                    properties: {
                      strengths: { type: 'array', items: { type: 'string' } },
                      improvements: { type: 'array', items: { type: 'string' } },
                    },
                  },
                  // Add other sections as needed
                },
              },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
            required: ['scores', 'sections', 'recommendations'],
          },
        },
      ],
      function_call: { name: 'analyze_resume' },
    });

    const functionAnalysisCall = analysisResponse.data.choices[0].message.function_call;
    const analysis = JSON.parse(functionAnalysisCall?.arguments || '{}');

    const formattedAnalysis = {
      scores: [
        { label: 'Overall', score: analysis.scores.overall, color: '#f97316' },
        { label: 'Experience', score: analysis.scores.experience, color: '#f97316' },
        { label: 'Education', score: analysis.scores.education, color: '#f97316' },
        { label: 'Skills', score: analysis.scores.skills, color: '#f97316' },
        { label: 'Projects', score: analysis.scores.projects, color: '#f97316' },
        { label: 'Impact', score: analysis.scores.impact, color: '#f97316' },
        { label: 'Format', score: analysis.scores.format, color: '#f97316' },
      ],
      analysis: {
        impact: analysis.sections.impact,
        experience: analysis.sections.experience,
        // Include other sections as needed
        recommendations: analysis.recommendations,
      },
    };

    if (filePath) {
      try {
        await unlink(filePath);
      } catch (deleteError) {
        console.error('Failed to delete file:', deleteError);
      }
    }

    return NextResponse.json(formattedAnalysis);
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
