import { FileText, Target, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BannerPage() {
  const features = [
    { 
      icon: Target, 
      text: "Smart Analysis", 
      color: "text-blue-500" 
    },
    { 
      icon: Award, 
      text: "Detailed Insights", 
      color: "text-green-500" 
    },
    { 
      icon: TrendingUp, 
      text: "Actionable Tips", 
      color: "text-purple-500" 
    }
  ];

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center 
      bg-gradient-to-br from-neutral-50 via-orange-50/50 to-neutral-50 
      dark:from-neutral-950 dark:via-neutral-900/80 dark:to-neutral-950 
      animate-gradient bg-size-200">
      <div className="flex flex-col items-center gap-10 text-center">
        <div className="flex items-center gap-4 animate-fade-in">
          <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-primary animate-pulse" />
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            ResumifyAI
          </h1>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <p className="text-xl sm:text-2xl text-muted-foreground text-center max-w-3xl px-4">
            Elevate your career with AI-powered resume analysis. Get instant, professional feedback to stand out in your job search.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4">
            {features.map(({ icon: Icon, text, color }) => (
              <div 
                key={text}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 
                  rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                <span className="text-base sm:text-xl font-semibold">
                  {text}
                </span>
              </div>
            ))}
          </div>

          <Link href="/resume-analyze" className="mt-6">
            <Button 
              size="lg" 
              className="group flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              Analyze Your Resume
              <FileText className="w-4 h-4 group-hover:animate-bounce" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}