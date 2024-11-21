import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import OgImage from '../public/banner.jpeg';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ResumifyAI.ismailbentabett.com'),
  title: {
    default: 'ResumifyAI - Professional Resume Analysis Tool',
    template: '%s | ResumifyAI',
  },
  description: 
    'AI-powered resume analysis tool providing instant, professional feedback and actionable recommendations to elevate your job search strategy.',
  keywords: [
    'AI resume analysis', 
    'resume optimization', 
    'career development', 
    'job search strategy', 
    'professional resume review',
    'career advancement',
    'resume scoring',
    'job application improvement'
  ],
  authors: [{ name: 'ismailbentabett', url: 'https://ismailbentabett.com' }],
  creator: 'ismailbentabett',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ResumifyAI.ismailbentabett.com',
    title: 'ResumifyAI - Professional Resume Analysis Tool',
    description: 
      'Transform your resume with AI-powered insights. Get instant, professional feedback to stand out in your job search.',
    siteName: 'ResumifyAI',
    images: [{
      url: OgImage.src,
      width: 1200,
      height: 630,
      alt: 'ResumifyAI - Elevate Your Career with AI Resume Analysis'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumifyAI - Professional Resume Analysis Tool',
    description: 
      'Transform your resume with AI-powered insights. Get instant, professional feedback to stand out in your job search.',
    images: [{
      url: OgImage.src,
      width: 1200,
      height: 630,
      alt: 'ResumifyAI - Elevate Your Career with AI Resume Analysis'
    }],
    creator: '@taufikismailbentabett',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://ResumifyAI.ismailbentabett.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Analytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col bg-gradient-to-br 
            from-neutral-50 via-orange-50/50 to-neutral-50 
            dark:from-neutral-950 dark:via-neutral-900/80 dark:to-neutral-950 
            animate-gradient bg-size-200 transition-all duration-500">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
            <Footer />
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}