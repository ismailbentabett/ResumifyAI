'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export function ResumeUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(1);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploading(true);
        // Simulate upload progress
        let currentProgress = 1;
        const interval = setInterval(() => {
          currentProgress += 10;
          currentProgress = Math.min(currentProgress, 100);
          
          setProgress(currentProgress);
          
          if (currentProgress === 100) {
            clearInterval(interval);
            setUploading(false);
            onUpload(file);
            toast.success('Resume successfully uploaded!', {
              description: `${file.name} has been processed`,
              duration: 3000,
            });
          }
        }, 100);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 3 * 1024 * 1024,
    onDropRejected: () => {
      toast.error('Upload Failed', {
        description: 'File must be PDF and under 3MB',
      });
    },
  });

  return (
    <div 
      {...getRootProps()}
      className="border-2 border-dashed border-primary/50 rounded-xl bg-background 
                 hover:bg-primary/5 transition-colors duration-300 
                 focus:outline-none focus:ring-2 focus:ring-primary/30 
                 py-8 px-6 text-center cursor-pointer group"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        {uploading ? (
          <div className="flex flex-col items-center space-y-4">
            <FileText 
              className="w-16 h-16 text-primary animate-bounce 
                         group-hover:text-primary/70 transition-colors"
            />
            <Progress 
              value={progress} 
              max={100} 
              className="w-full max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Processing your resume...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <CloudUpload 
              className="w-16 h-16 text-primary 
                         group-hover:text-primary/70 transition-colors"
            />
            <h3 className="text-xl font-bold text-foreground">
              {isDragActive 
                ? 'Drop your resume here' 
                : 'Upload Your Resume'}
            </h3>
            <p className="text-sm text-muted-foreground">
              PDF files up to 3MB | Drag & drop or click to browse
            </p>
            <Button 
              variant="outline" 
              className="group-hover:bg-primary/10 transition-colors"
            >
              Select Resume
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}