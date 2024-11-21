import jsPDF from 'jspdf';

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

export async function generatePDF(analysis: AnalysisResult) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Helper functions
  const addTitle = (text: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(text, margin, y);
    y += 10;
  };

  const addSubtitle = (text: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(text, margin, y);
    y += 8;
  };

  const addText = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  };

  const addList = (items: string[]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    items.forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 2 * margin - 5);
      doc.text(lines, margin + 5, y);
      y += lines.length * 5 + 3;
    });
  };

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Resume Analysis Report', margin, y);
  y += 15;

  // Scores
  addTitle('Overall Scores');
  analysis.scores.forEach(score => {
    checkPageBreak(8);
    addText(`${score.label}: ${score.score}%`);
  });
  y += 10;

  // Experience Section
  checkPageBreak(60);
  addTitle('Professional Experience');
  addSubtitle('Strengths');
  addList(analysis.analysis.experience.strengths);
  addSubtitle('Areas for Improvement');
  addList(analysis.analysis.experience.improvements);
  y += 10;

  // Education Section
  checkPageBreak(60);
  addTitle('Education');
  addSubtitle('Strengths');
  addList(analysis.analysis.education.strengths);
  addSubtitle('Areas for Improvement');
  addList(analysis.analysis.education.improvements);
  y += 10;

  // Projects Section
  checkPageBreak(60);
  addTitle('Projects');
  addSubtitle('Strengths');
  addList(analysis.analysis.projects.strengths);
  addSubtitle('Areas for Improvement');
  addList(analysis.analysis.projects.improvements);
  y += 10;

  // Skills Section
  checkPageBreak(60);
  addTitle('Skills & Expertise');
  addSubtitle('Strengths');
  addList(analysis.analysis.skills.strengths);
  addSubtitle('Areas for Improvement');
  addList(analysis.analysis.skills.improvements);
  y += 10;

  // Impact Section
  checkPageBreak(60);
  addTitle('Impact & Achievements');
  addSubtitle('Strengths');
  addList(analysis.analysis.impact.strengths);
  addSubtitle('Areas for Improvement');
  addList(analysis.analysis.impact.improvements);
  y += 10;

  // Format Section
  checkPageBreak(60);
  addTitle('Format & Structure');
  addSubtitle('Strengths');
  addList(analysis.analysis.format.strengths);
  addSubtitle('Areas for Improvement');
  addList(analysis.analysis.format.improvements);
  y += 10;

  // Recommendations
  checkPageBreak(40);
  addTitle('Key Recommendations');
  addList(analysis.analysis.recommendations);

  // Save the PDF
  doc.save('resume-analysis.pdf');
}