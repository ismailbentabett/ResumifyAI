'use client';

import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnalysisSectionProps {
  title: string;
  icon: LucideIcon;
  strengths: string[];
  improvements: string[];
}

export function AnalysisSection({
  title,
  icon: Icon,
  strengths,
  improvements,
}: AnalysisSectionProps) {
  const hasImrpovements = improvements.length > 0;
  const hasStrengths = strengths.length > 0;
  return (
    <Card className="glassmorphism p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
            Strengths
          </h3>
          {!hasStrengths && (
            <p className="text-sm sm:text-base text-muted-foreground">
              No strengths found.
            </p>
          )}
          {hasStrengths && (
            <ul className="space-y-2 list-disc list-inside marker:text-primary">
              {strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">
            Areas for Improvement
          </h3>
          {!hasImrpovements && (
            <p className="text-sm sm:text-base text-muted-foreground">
              No areas for improvement.
            </p>
          )}
          {hasImrpovements && (
            <ul className="space-y-2 list-disc list-inside marker:text-primary">
              {improvements.map((improvement) => (
                <li key={improvement}>{improvement}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
