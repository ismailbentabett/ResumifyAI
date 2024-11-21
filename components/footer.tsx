'use client';

import { Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur 
                       supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Created by</span>
          <Link
            href="https://ismailbentabett.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-semibold text-foreground 
                       hover:text-primary transition-colors group"
          >
            <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            ismailbentabett
            <ExternalLink 
              className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 
                         transition-opacity text-muted-foreground"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}