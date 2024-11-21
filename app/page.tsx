'use client';

import { useState } from 'react';
import { ResumeUpload } from '@/components/resume-upload';
import { AnalysisChart } from '@/components/analysis-chart';
import { AnalysisSection } from '@/components/analysis-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  Download,
  GraduationCap,
  Briefcase,
  Code,
  Target,
  Layout,
  Trophy,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { generatePDF } from '@/lib/pdf-generator';

interface AnalysisResult {
  scores: Array<{
    label: string;
    score: number;
    color: string;
  }>;
  analysis: {
    impact: {
      strengths: string[];
      improvements: string[];
    };
    education: {
      strengths: string[];
      improvements: string[];
    };
    projects: {
      strengths: string[];
      improvements: string[];
    };
    skills: {
      strengths: string[];
      improvements: string[];
    };
    experience: {
      strengths: string[];
      improvements: string[];
    };
    format: {
      strengths: string[];
      improvements: string[];
    };
    recommendations: string[];
  };
}

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);
      setFileName(file.name);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        return toast.error(result.error || 'Resume analysis failed');
      }

      setAnalysis(result);
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!analysis) return;
    try {
      await generatePDF(analysis);
      toast.success('Detailed report downloaded!', {
        description: `Analysis for ${fileName} generated successfully`
      });
    } catch {
      toast.error('PDF generation failed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-xl font-medium text-muted-foreground">
            AI is analyzing your resume...
          </p>
        </div>
      ) : !analysis ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-4">
          <ResumeUpload onUpload={handleUpload} />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">
                Resume Analysis Results
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => {
                  setAnalysis(null);
                  setFileName(null);
                }}
                variant="outline" 
                size="icon"
                className="hover:bg-primary/10"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>

              <Button
                onClick={handleDownloadPDF}
                className="group flex items-center gap-2"
              >
                <Download className="w-4 h-4 group-hover:animate-bounce" />
                Download Report
              </Button>
            </div>
          </div>

          <Card className="glassmorphism p-6 space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              Overall Performance Snapshot
            </h2>
            <AnalysisChart data={analysis.scores} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { 
                title: "Impact & Achievements", 
                icon: Trophy, 
                data: analysis.analysis.impact 
              },
              { 
                title: "Education", 
                icon: GraduationCap, 
                data: analysis.analysis.education 
              },
              { 
                title: "Projects", 
                icon: Code, 
                data: analysis.analysis.projects 
              },
              { 
                title: "Skills & Expertise", 
                icon: Target, 
                data: analysis.analysis.skills 
              },
              { 
                title: "Professional Experience", 
                icon: Briefcase, 
                data: analysis.analysis.experience 
              },
              { 
                title: "Format & Structure", 
                icon: Layout, 
                data: analysis.analysis.format 
              },
            ].map(({ title, icon: Icon, data }) => (
              <AnalysisSection
                key={title}
                title={title}
                icon={Icon}
                strengths={data.strengths}
                improvements={data.improvements}
              />
            ))}
          </div>

          <Card className="glassmorphism p-6 space-y-4">
            <h2 className="text-2xl font-semibold">
              Strategic Recommendations
            </h2>
            <ul className="space-y-3">
              {analysis.analysis.recommendations.map(
                (recommendation, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3 text-muted-foreground"
                  >
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span className="text-base">{recommendation}</span>
                  </li>
                )
              )}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}