'use client';

import { FileText, Github, FolderKanban } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur 
                    supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link 
          href="/" 
          className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
        >
          <FolderKanban className="h-7 w-7 text-primary group-hover:rotate-6 transition-transform" />
          <span className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            ResumifyAI
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com/ismailbentabett/ResumifyAI"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Github 
              className="h-6 w-6 text-muted-foreground group-hover:text-primary 
                         transition-colors duration-300"
            />
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}